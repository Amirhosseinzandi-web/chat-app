// Chatty service worker: Web Push notifications + offline shell.
// Browsers (iOS 16.4+, current Chrome/Firefox) decrypt the encrypted push
// payload themselves and deliver the plaintext record to event.data here.

const NOTIFICATION_SOUND = "notification.wav";

self.addEventListener("push", (event) => {
    let data = {};
    try {
        if (event.data) data = event.data.json();
    } catch (e) {
        // undecryptable / unexpected shape - still show a generic notification
        data = {};
    }
    event.waitUntil(showChattyNotification(data));
});

async function showChattyNotification(data) {
    try {
        const title = data.title || "Chatty";
        const body = data.body || "You have a new message";
        await self.registration.showNotification(title, {
            body: body,
            icon: "/icon-512.png",
            badge: "/icon-192.png",
            sound: NOTIFICATION_SOUND,
            tag: "chatty-message",
            renotify: true,
            data: {
                conversationId: data.conversationId || "",
            },
        });
    } catch (err) {
        // last resort (e.g. permission revoked) - swallow
    }
}

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const conversationId = event.notification.data && event.notification.data.conversationId;
    // deep link: open the conversation that sent the push, if provided
    const url = conversationId ? "/?cid=" + conversationId : "/";
    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
            for (const w of wins) {
                if ("focus" in w) { w.focus(); w.navigate(url); return; }
            }
            return self.clients.openWindow(url);
        })
    );
});

// browser rotated the push keys (rare) -> ask the page to re-subscribe
self.addEventListener("pushsubscriptionchange", (event) => {
    event.waitUntil(
        self.clients.matchAll({ type: "window" }).then((wins) => {
            wins.forEach((w) => w.postMessage({ type: "PUSH_RESUBSCRIBE" }));
        })
    );
});

// ---------------- offline app shell ----------------
const CACHE = "chatty-shell-v1";
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE).then((c) => c.addAll(["/", "/icon-192.png", "/icon-512.png"]))
            .catch(() => caches.open(CACHE)) // ignore if offline during install
    );
});
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    );
});
self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // never touch the API
    event.respondWith(
        fetch(req)
            .then((res) => {
                if (res.ok && req.mode === "navigate") {
                    const clone = res.clone();
                    caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
                }
                return res;
            })
            .catch(() => (req.mode === "navigate" ? caches.match(req) : caches.match(req)))
    );
});
