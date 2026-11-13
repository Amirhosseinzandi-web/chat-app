import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toB64Url = (bytes) =>
    Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64Url = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const concat = (...a) => {
    const t = a.reduce((n, x) => n + x.length, 0);
    const o = new Uint8Array(t); let off = 0;
    for (const x of a) { o.set(x, off); off += x.length; }
    return o;
};

// classic node:crypto (WebCrypto in Node cannot generate EC keys)
const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const privateJwk = privateKey.export({ format: "jwk" });
const publicJwk = publicKey.export({ format: "jwk" });
// raw public key = 0x04 || x || y
const rawPublic = concat(new Uint8Array([4]), fromB64Url(publicJwk.x), fromB64Url(publicJwk.y));

const out =
    "VAPID_PUBLIC_KEY=" + toB64Url(rawPublic) +
    "\nVAPID_PRIVATE_KEY=" + JSON.stringify(privateJwk) +
    "\n";

const envPath = path.join(__dirname, "..", ".env");
const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
if (current.includes("VAPID_PUBLIC_KEY=")) {
    console.log("VAPID keys already present in .env - nothing to do.");
    process.exit(0);
}
fs.appendFileSync(envPath, out);
console.log("appended VAPID keys to backend/.env");
console.log("public key:", toB64Url(rawPublic));
