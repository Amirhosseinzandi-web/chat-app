// Web Push (VAPID) - Node 20 built-ins only (node:crypto + fetch).
// Payload encryption follows the Web Push encryption draft exactly
// (same algorithm as the battle-tested web-push-encryption package):
//   random 16-byte salt, fresh ECDH P-256 keypair, HKDF, AES-128-GCM.
//
// The BROWSER (iOS 16.4+, current Chrome/Firefox) holds the client-side ECDH
// private key and decrypts the payload itself, delivering the plaintext to
// the service worker via event.data. We only need to encrypt correctly here.

import crypto from "node:crypto";

const subtle = crypto.webcrypto.subtle;
const textEncoder = new TextEncoder();

const AUTH_INFO = textEncoder.encode("Content-Encoding: auth\0");
const MAX_PAYLOAD_LENGTH = 4078;

// ---------- base64url ----------
const toB64Url = (bytes) =>
    Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64Url = (str) =>
    Buffer.from(String(str).replace(/-/g, "+").replace(/_/g, "/"), "base64");

const concatBytes = (...arrays) => {
    const total = arrays.reduce((n, a) => n + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) {
        out.set(a, offset);
        offset += a.length;
    }
    return out;
};

// ---------- HKDF (single-block variant required by the spec) ----------
// hkdf(salt, ikm, info, length) = HMAC(HMAC(salt, ikm), info || 0x01)
const hmacSha256 = async (key, ...msgs) => {
    const cryptoKey = await subtle.importKey(
        "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await subtle.sign("HMAC", cryptoKey, concatBytes(...msgs));
    return new Uint8Array(sig);
};

const hkdf = async (salt, ikm, info, length) => {
    const prk = await hmacSha256(salt, ikm);
    const expanded = await hmacSha256(prk, info, new Uint8Array([1]));
    return expanded.slice(0, length);
};

// ---------- info records + context (web push encryption draft) ----------
const createInfo = (type, context) => {
    const t = textEncoder.encode(type);
    const info = new Uint8Array(18 + t.length + 1 + 5 + context.length);
    info.set(textEncoder.encode("Content-Encoding: "), 0);
    info.set(t, 18);
    info[18 + t.length] = 0;
    info.set(textEncoder.encode("P-256"), 19 + t.length);
    info.set(context, 24 + t.length);
    return info;
};

const createContext = (clientPublicKey, serverPublicKey) => {
    if (clientPublicKey.length !== 65 || serverPublicKey.length !== 65) {
        throw new Error("invalid EC key length");
    }
    const context = new Uint8Array(1 + 2 + 65 + 2 + 65);
    context[0] = 0;
    new DataView(context.buffer).setUint16(1, clientPublicKey.length, false);
    context.set(clientPublicKey, 3);
    new DataView(context.buffer).setUint16(68, serverPublicKey.length, false);
    context.set(serverPublicKey, 70);
    return context;
};

// ---------- VAPID (ES256 JWT, built-in WebCrypto) ----------
const base64UrlJson = (obj) => toB64Url(textEncoder.encode(JSON.stringify(obj)));

let cachedPrivateJwk = null;

export const setVapidKeys = (privateJwk) => {
    cachedPrivateJwk = privateJwk;
};

const importPrivate = async () => {
    if (!cachedPrivateJwk) {
        throw new Error("VAPID keys not configured (run scripts/generate-vapid-keys.js)");
    }
    return subtle.importKey("jwk", cachedPrivateJwk, { name: "EC", namedCurve: "P-256" }, true, ["sign"]);
};

// public key for the browser: base64url(0x04 || x || y), derived from the private JWK
export const vapidPublicKeyBase64Url = () => {
    if (!cachedPrivateJwk) throw new Error("VAPID keys not configured");
    return toB64Url(concatBytes(new Uint8Array([4]), fromB64Url(cachedPrivateJwk.x), fromB64Url(cachedPrivateJwk.y)));
};

const signVapidToken = async (endpoint) => {
    const url = new URL(endpoint);
    const subject = process.env.VAPID_SUBJECT || "mailto:blackviper933@gmail.com";
    const headers = base64UrlJson({ typ: "JWT", alg: "ES256" });
    const claims = base64UrlJson({
        sub: subject,
        aud: url.origin,
        exp: Math.floor(Date.now() / 1000) + 60 * 20 // 20 min
    });
    const signingInput = headers + "." + claims;
    const key = await importPrivate();
    const sig = await subtle.sign("ECDSA", key, { name: "ES256" }, textEncoder.encode(signingInput));
    // WebCrypto ES256 output is raw r||s (64 bytes) - exactly what VAPID wants
    return signingInput + "." + toB64Url(new Uint8Array(sig));
};

// ---------- encrypt (pure - no network). Returns everything needed to send. ----------
export const encryptPush = async (subscription, payloadObject) => {
    const recordBytes = textEncoder.encode(JSON.stringify(payloadObject));
    if (recordBytes.length > MAX_PAYLOAD_LENGTH) {
        throw new Error("payload too large for web push");
    }

    // plaintext = 2-byte BE padding-length (0) + padding + record (browser strips the header)
    const plaintext = new Uint8Array(2 + recordBytes.length);
    plaintext[0] = 0;
    plaintext[1] = 0;
    plaintext.set(recordBytes, 2);

    const clientPublicKey = fromB64Url(subscription.keys.p256dh);
    const clientAuthToken = fromB64Url(subscription.keys.auth);
    if (clientAuthToken.length !== 16) throw new Error("invalid auth token length");
    if (clientPublicKey.length !== 65) throw new Error("invalid p256dh key length");

    const salt = crypto.getRandomValues(new Uint8Array(16));

    // fresh ECDH keypair per message (classic node:crypto; WebCrypto cannot generate EC keys)
    const ecdh = crypto.createECDH("prime256v1");
    ecdh.generateKeys();
    const serverPublicKey = new Uint8Array(ecdh.getPublicKey()); // 65 bytes, 0x04-prefixed
    const sharedSecret = new Uint8Array(ecdh.computeSecret(Buffer.from(clientPublicKey)));

    const prk = await hkdf(clientAuthToken, sharedSecret, AUTH_INFO, 32);
    const context = createContext(clientPublicKey, serverPublicKey);
    const contentKey = await hkdf(salt, prk, createInfo("aesgcm", context), 16);
    const nonce = await hkdf(salt, prk, createInfo("nonce", context), 12);

    const gcmKey = await subtle.importKey("raw", contentKey, { name: "AES-GCM" }, false, ["encrypt"]);
    const ciphertext = await subtle.encrypt({ name: "AES-GCM", iv: nonce }, gcmKey, plaintext);

    // body = salt(16) || serverPublicKey(65) || ciphertext || authTag(16)
    const body = concatBytes(salt, serverPublicKey, new Uint8Array(ciphertext));

    return { body, serverPublicKey, contentKey, nonce, salt };
};

// ---------- encrypt + send ----------
export const pushToSubscription = async (subscription, payloadObject) => {
    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        throw new Error("invalid subscription");
    }

    const { body, serverPublicKey } = await encryptPush(subscription, payloadObject);
    const token = await signVapidToken(subscription.endpoint);

    const res = await fetch(subscription.endpoint, {
        method: "POST",
        headers: {
            "Content-Encoding": "aesgcm",
            "Content-Length": String(body.length),
            "Crypto-Key": "dh=" + toB64Url(serverPublicKey) + ",p256ecdsa=" + vapidPublicKeyBase64Url(),
            "Authorization": "WebPush " + token,
            "TTL": "60"
        },
        body: Buffer.from(body)
    });

    if (!res.ok && res.status !== 410 && res.status !== 404) {
        const errText = await res.text().catch(() => "");
        throw new Error("push failed " + res.status + ": " + errText.slice(0, 200));
    }
    return res.ok;
};
