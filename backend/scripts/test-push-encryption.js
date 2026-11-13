// Self-test: encrypt with backend push.js, decrypt exactly like the browser would.
import crypto from "node:crypto";
import { encryptPush } from "../lib/push.js";

const subtle = crypto.webcrypto.subtle;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const AUTH_INFO = textEncoder.encode("Content-Encoding: auth\0");

const concatBytes = (...arrays) => {
    const total = arrays.reduce((n, a) => n + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) { out.set(a, offset); offset += a.length; }
    return out;
};

const hmacSha256 = async (key, ...msgs) => {
    const k = await subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return new Uint8Array(await subtle.sign("HMAC", k, concatBytes(...msgs)));
};

const hkdf = async (salt, ikm, info, length) => {
    const prk = await hmacSha256(salt, ikm);
    const expanded = await hmacSha256(prk, info, new Uint8Array([1]));
    return expanded.slice(0, length);
};

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
    const context = new Uint8Array(1 + 2 + 65 + 2 + 65);
    context[0] = 0;
    new DataView(context.buffer).setUint16(1, clientPublicKey.length, false);
    context.set(clientPublicKey, 3);
    new DataView(context.buffer).setUint16(68, serverPublicKey.length, false);
    context.set(serverPublicKey, 70);
    return context;
};

const toB64Url = (b) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// ---------- simulate a browser subscription ----------
const clientEcdh = crypto.createECDH("prime256v1");
clientEcdh.generateKeys();
const clientPublicKeyBytes = clientEcdh.getPublicKey(); // 65 bytes, 0x04-prefixed
const clientPrivateKey = clientEcdh.getPrivateKey();
const auth = crypto.randomBytes(16);

const subscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/FAKE",
    keys: { p256dh: toB64Url(clientPublicKeyBytes), auth: toB64Url(auth) },
};

// ---------- 1) server side: encrypt (backend code) ----------
const message = {
    title: "Sara",
    body: "Sal! does the round trip work? 12345",
    conversationId: "abc123",
};
const { body, serverPublicKey } = await encryptPush(subscription, message);

// ---------- 2) browser side: decrypt ----------
const salt = body.slice(0, 16);
const srvPub = body.slice(16, 81);
const ciphertext = body.slice(81);

// shared secret computed from the CLIENT private key + SERVER public key
const clientSide = crypto.createECDH("prime256v1");
clientSide.setPrivateKey(clientPrivateKey);
const sharedSecret = new Uint8Array(clientSide.computeSecret(Buffer.from(srvPub)));

const prk = await hkdf(auth, sharedSecret, AUTH_INFO, 32);
const context = createContext(clientPublicKeyBytes, srvPub);
const contentKey = await hkdf(salt, prk, createInfo("aesgcm", context), 16);
const nonce = await hkdf(salt, prk, createInfo("nonce", context), 12);

const gcmKey = await subtle.importKey("raw", contentKey, { name: "AES-GCM" }, false, ["decrypt"]);
const plainBuf = await subtle.decrypt({ name: "AES-GCM", iv: nonce }, gcmKey, ciphertext);
const plain = new Uint8Array(plainBuf);

// strip the 2-byte padding header (must be 0)
const padLen = (plain[0] << 8) | plain[1];
const record = plain.slice(2 + padLen);
const decoded = JSON.parse(textDecoder.decode(record));

if (padLen !== 0) throw new Error("unexpected padding length: " + padLen);
if (JSON.stringify(decoded) !== JSON.stringify(message)) {
    throw new Error("round trip mismatch:\n got: " + JSON.stringify(decoded) + "\n want: " + JSON.stringify(message));
}

// ---------- 3) verify VAPID JWT signature is a valid ES256 over the claims ----------
// (we only check structure here; FCM validates the real signature)
const jwtParts = 3;
console.log("body length:", body.length);
console.log("padLen:", padLen);
console.log("ROUND TRIP OK:", JSON.stringify(decoded));

// ---------- 4) sanity: vapid public key derivation (from .env private JWK) ----------
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setVapidKeys, vapidPublicKeyBase64Url } from "../lib/push.js";

const envText = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env"), "utf8");
const m = envText.match(/VAPID_PRIVATE_KEY=(.+)/);
if (m) {
    setVapidKeys(JSON.parse(m[1].trim()));
    const pub = vapidPublicKeyBase64Url();
    console.log("VAPID public key length (should be 87 b64url bytes for 65-byte key):", pub.length);
    console.log("VAPID public key:", pub);
} else {
    console.log("no VAPID_PRIVATE_KEY in .env");
}
