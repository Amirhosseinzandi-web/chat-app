"use client"

import { useEffect, useState } from "react";
import { myThemes } from "@/constant/themes";
import { useThemeStore } from "@/store/useThemeStore";
import { usePushStore } from "@/store/usePushStore";
import {
    pushSupported,
    getNotificationPermission,
    enablePushNotifications,
    disablePushNotifications,
    isInstallAvailable,
    isInstalled,
    promptInstall,
} from "@/lib/pushClient";
import { axiosInstance } from "@/lib/axios";
import { Send, Bell, BellOff, Download, CheckCircle2, Smartphone, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";



const PREVIEW_MESSAGES = [
    { id: 1, content: "Hey! How's it going?", isSent: false },
    { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];



const isIOS = () =>
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/.test(navigator.userAgent);



const SettingsComponent = () => {
    const { theme, setTheme } = useThemeStore()
    const { notificationsEnabled, setNotificationsEnabled } = usePushStore()

    const [pushState, setPushState] = useState<{
        supported: boolean;
        permission: NotificationPermission | "unsupported";
        subscribed: boolean;
        busy: boolean;
    }>({ supported: false, permission: "default", subscribed: false, busy: false });

    const [install, setInstall] = useState<{ available: boolean; installed: boolean }>({
        available: false, installed: false,
    });

    const refreshPushState = async () => {
        const supported = pushSupported();
        if (!supported) {
            setPushState({ supported: false, permission: "unsupported", subscribed: false, busy: false });
            return;
        }
        let subscribed = false;
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            subscribed = !!sub;
        } catch {
            subscribed = false;
        }
        setPushState({
            supported: true,
            permission: getNotificationPermission(),
            subscribed,
            busy: false,
        });
    };

    const refreshInstall = () => {
        setInstall({ available: isInstallAvailable(), installed: isInstalled() });
    };

    useEffect(() => {
        refreshPushState();
        refreshInstall();
        const onAvail = () => refreshInstall();
        const onDone = () => refreshInstall();
        window.addEventListener("chatty-install-available", onAvail);
        window.addEventListener("chatty-install-done", onDone);
        window.addEventListener("focus", refreshPushState);
        return () => {
            window.removeEventListener("chatty-install-available", onAvail);
            window.removeEventListener("chatty-install-done", onDone);
            window.removeEventListener("focus", refreshPushState);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEnablePush = async () => {
        setPushState((s) => ({ ...s, busy: true }));
        const ok = await enablePushNotifications();
        if (ok) toast.success("Notifications enabled");
        else toast.error("Could not enable notifications");
        await refreshPushState();
    };

    const handleDisablePush = async () => {
        setPushState((s) => ({ ...s, busy: true }));
        await disablePushNotifications();
        toast.success("Notifications disabled");
        await refreshPushState();
    };

    const handleTestPush = async () => {
        try {
            const res = await axiosInstance.post("/api/push/test");
            if (res.data.sent > 0) toast.success("Test notification sent - look at your device!");
            else toast.error("No device to send to");
        } catch {
            toast.error("Could not send test");
        }
    };

    const handleInstall = async () => {
        const outcome = await promptInstall();
        if (outcome === "accepted") toast.success("Chatty installed!");
        refreshInstall();
    };

    const notifActive = pushState.supported &&
        pushState.permission === "granted" &&
        pushState.subscribed &&
        notificationsEnabled;

    return (
        <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
            <div className="space-y-6">

                {/* ================= Notifications ================= */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Notifications</h2>
                    <p className="text-sm text-base-content/70">
                        Get a push notification for new messages - even when the app is closed
                        (works on installed apps on phones; on a desktop browser, keep a tab open).
                    </p>
                </div>

                <div className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-4 shadow-sm">
                    {/* master switch: app-level mute (Telegram-style) */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {notifActive
                                ? <Bell size={20} className="text-primary" />
                                : <BellOff size={20} className="text-base-content/40" />}
                            <div>
                                <p className="text-sm font-medium">Message notifications</p>
                                <p className="text-xs text-base-content/60">
                                    {notifActive ? "You will be notified about new messages" : "Notifications are off"}
                                </p>
                            </div>
                        </div>
                        <label className="swap swap-join swap-rotate">
                            <input
                                type="checkbox"
                                className="swap-input"
                                checked={notificationsEnabled}
                                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                            />
                            <div className="swap-off w-12 h-6 rounded-full bg-base-300 grid place-items-center">
                                <BellOff size={14} />
                            </div>
                            <div className="swap-on w-12 h-6 rounded-full bg-primary grid place-items-center">
                                <Bell size={14} className="text-primary-content" />
                            </div>
                        </label>
                    </div>

                    <div className="divider my-0"></div>

                    {/* device / subscription */}
                    {!pushState.supported && (
                        <div className="flex items-start gap-3 text-sm">
                            <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Push not supported here</p>
                                <p className="text-base-content/60">
                                    This browser does not support web push. On iOS, install the app first
                                    (Safari → Share → Add to Home Screen) on iOS 16.4+.
                                </p>
                            </div>
                        </div>
                    )}

                    {pushState.supported && pushState.permission === "denied" && (
                        <div className="flex items-start gap-3 text-sm">
                            <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
                            <p className="text-base-content/70">
                                Notifications are blocked in your browser settings for this site.
                                Allow them (site settings → Notifications) to receive push.
                            </p>
                        </div>
                    )}

                    {pushState.supported && pushState.permission === "default" && (
                        <button className="btn btn-primary btn-sm" disabled={pushState.busy} onClick={handleEnablePush}>
                            <Bell size={16} /> Enable notifications
                        </button>
                    )}

                    {pushState.supported && pushState.permission === "granted" && (
                        <div className="flex flex-wrap items-center gap-2">
                            {pushState.subscribed && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                                    <CheckCircle2 size={15} /> Push enabled on this device
                                </span>
                            )}
                            {pushState.subscribed && (
                                <button className="btn btn-ghost btn-xs" disabled={pushState.busy} onClick={handleTestPush}>
                                    Send test
                                </button>
                            )}
                            {pushState.subscribed && (
                                <button className="btn btn-ghost btn-xs" disabled={pushState.busy} onClick={handleDisablePush}>
                                    Disable
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ================= Install App ================= */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Install app</h2>
                    <p className="text-sm text-base-content/70">
                        Install Chatty to use it like a native app - full screen, icon on your home screen,
                        and the best notifications.
                    </p>
                </div>

                <div className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-3 shadow-sm">
                    {install.installed && (
                        <div className="flex items-center gap-2 text-sm text-success">
                            <CheckCircle2 size={18} /> Chatty is installed on this device.
                        </div>
                    )}

                    {install.available && !install.installed && (
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Download size={20} className="text-primary" />
                                <p className="text-sm font-medium">Install Chatty now</p>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={handleInstall}>
                                <Download size={16} /> Install
                            </button>
                        </div>
                    )}

                    {!install.available && !install.installed && isIOS() && (
                        <div className="flex items-start gap-3 text-sm">
                            <Smartphone size={18} className="text-primary shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-medium">Install on iPhone / iPad</p>
                                <p className="text-base-content/60">
                                    1. Open Chatty in Safari. 2. Tap the Share button (the square with an arrow).
                                </p>
                                <p className="text-base-content/60">
                                    3. Choose “Add to Home Screen” and tap Add.
                                </p>
                                <p className="text-base-content/60">
                                    (Push notifications need iOS 16.4 or later.)
                                </p>
                            </div>
                        </div>
                    )}

                    {!install.available && !install.installed && !isIOS() && (
                        <p className="text-sm text-base-content/60">
                            Install option is not available right now. Try opening Chatty from your phone’s browser
                            or desktop Chrome/Edge, then look for the install icon in the address bar.
                        </p>
                    )}
                </div>

                {/* ================= Theme ================= */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Theme</h2>
                    <p className="text-sm text-base-content/70">Choose a theme for your chat interface</p>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {myThemes.map((t) => (
                        <button
                            key={t}
                            className={`
                    group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                    ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
                  `}
                            onClick={() => setTheme(t)}
                        >
                            <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                                    <div className="rounded bg-primary"></div>
                                    <div className="rounded bg-secondary"></div>
                                    <div className="rounded bg-accent"></div>
                                    <div className="rounded bg-neutral"></div>
                                </div>
                            </div>
                            <span className="text-[11px] font-medium truncate w-full text-center">
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Preview Section */}
                <h3 className="text-lg font-semibold mb-3">Preview</h3>
                <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
                    <div className="p-4 bg-base-200">
                        <div className="max-w-lg mx-auto">
                            <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                                            J
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-sm">John Doe</h3>
                                            <p className="text-xs text-base-content/70">Online</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                                    {PREVIEW_MESSAGES.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`
                               max-w-[80%] rounded-xl p-3 shadow-sm
                               ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                             `}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                                <p
                                                    className={`
                                 text-[10px] mt-1.5
                                 ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                               `}
                                                >
                                                    12:00 PM
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 border-t border-base-300 bg-base-100">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="input input-bordered flex-1 text-sm h-10"
                                            placeholder="Type a message..."
                                            value="This is a preview"
                                            readOnly
                                        />
                                        <button className="btn btn-primary h-10 min-h-0">
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsComponent;
