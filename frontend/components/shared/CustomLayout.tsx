"use client"

import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";




const CustomLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { authUser, isCheckingAuth, checkAuth } = useAuthStore()

    useEffect(() => {
        checkAuth();
    }, [])

    return (
        <>
            {children}
            <Toaster position="top-center" />
        </>
    );
}

export default CustomLayout;