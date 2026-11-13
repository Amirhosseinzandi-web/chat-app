// Client-side Web Push + PWA install helpers (no extra packages).
// The BROWSER generates and keeps the client ECDH keypair when we call
// pushManager.subscribe() - it decrypts pushes internally and hands the
// plaintext to the service worker via event.data. We only store the
// subscription endpoint server-side.

// ---------- VAPID ----------
const urlBase64ToUint8Array = (str: string) => {
    const s = String(str).replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (s.length % 4)) % 4);
    const raw = atob(s + padding);
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export const pushSupported = (): boolean =>
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

export const getNotificationPermission = () =>
    "Notification" in window ? Notification.permission : "denied";

// Returns true when push is now enabled (subscribed + stored server-side).
export const enablePushNotifications = async (): Promise<boolean> => {
    if (!pushSupported()) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;

    // VAPID public key from the backend (rotation without a rebuild)
    const { axiosInstance } = await import("@/lib/axios");
    const { data } = await axiosInstance.get<{ publicKey: string }>("/api/push/public-key");

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });
    }

    await axiosInstance.post("/api/push/subscribe", subscription.toJSON());
    return true;
};

export const disablePushNotifications = async (): Promise<boolean> => {
    if (!pushSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;
    const { axiosInstance } = await import("@/lib/axios");
    await axiosInstance.delete("/api/push/unsubscribe", { data: { endpoint: subscription.endpoint } });
    await subscription.unsubscribe();
    return true;
};

// ---------- PWA install (the browser's own prompt when available) ----------
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;

export const setupInstallPrompt = () => {
    if (typeof window === "undefined") return;
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        window.dispatchEvent(new Event("chatty-install-available"));
    });
    window.addEventListener("appinstalled", () => {
        installed = true;
        deferredPrompt = null;
        window.dispatchEvent(new Event("chatty-install-done"));
    });
};

export const isInstallAvailable = () => deferredPrompt !== null && !installed;
export const isInstalled = () => installed;

export const promptInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
        installed = true;
        deferredPrompt = null;
    }
    return choice.outcome;
};

// Detect "already installed" (e.g. iOS standalone mode) on load
export const detectInstalledState = () => {
    if (typeof window === "undefined") return;
    const standalone =
        (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true; // iOS
    if (standalone) installed = true;
};

// Listen for the SW asking us to re-subscribe (key rotation)
export const setupResubscribeListener = async () => {
    if (typeof window === "undefined") return;
    window.addEventListener("message", async (e) => {
        if (e.data && e.data.type === "PUSH_RESUBSCRIBE") {
            try {
                const registration = await navigator.serviceWorker.ready;
                const oldSub = await registration.pushManager.getSubscription();
                if (!oldSub) return;
                const { axiosInstance } = await import("@/lib/axios");
                const { data } = await axiosInstance.get<{ publicKey: string }>("/api/push/public-key");
                const newSub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(data.publicKey),
                });
                await axiosInstance.post("/api/push/subscribe", newSub.toJSON());
            } catch {
                // best effort
            }
        }
    });
};
