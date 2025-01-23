"use client"

import { useAuthStore } from "@/store/useAuthStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";



const CustomLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { isCheckingAuth, checkAuth, onlineUsers } = useAuthStore()
    const { theme } = useThemeStore()


    useEffect(() => {
        checkAuth();
    }, [])


    // useEffect(() => {
    //     console.log(onlineUsers);

    // }, [onlineUsers])


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