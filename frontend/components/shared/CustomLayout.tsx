"use client"

import { useAuthStore } from "@/store/useAuthStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { setupInstallPrompt, setupResubscribeListener, detectInstalledState } from "@/lib/pushClient";


const CustomLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { isCheckingAuth, checkAuth } = useAuthStore()
    const { theme } = useThemeStore()


    useEffect(() => {
        checkAuth();
    }, [])

    // PWA: register the service worker (needed for notifications) + install prompt
    useEffect(() => {
        detectInstalledState();
        setupInstallPrompt();
        setupResubscribeListener();

        if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
            const registerSW = async () => {
                try {
                    await navigator.serviceWorker.register("/sw.js");
                } catch (err) {
                    // SW registration failed (e.g. non-secure context) - the app
                    // still works, just without push notifications
                    console.log("service worker registration failed:", err);
                }
            };
            registerSW();
        }
    }, [])


    if (isCheckingAuth) {
        return <span className="loading loading-ring loading-lg absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]"></span>
    }


    return (
        <div data-theme={theme}>
            {children}
            <Toaster position="top-center" />
        </div>
    );
}

export default CustomLayout;
