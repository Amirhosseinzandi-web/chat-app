"use client"

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";




const CustomLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { authUser, isCheckingAuth, checkAuth } = useAuthStore()
    const router = useRouter();


    useEffect(() => {
        checkAuth();
    }, [])



    useEffect(() => {
        if (!isCheckingAuth) {
            if (authUser) {
                router.push("/")
            } else {
                router.push("/login")
            }
        }
    }, [authUser, isCheckingAuth])


    if (isCheckingAuth) {
        return <span className="loading loading-ring loading-lg absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]"></span>
    }


    return (
        <>
            {children}
            <Toaster position="top-center" />
        </>
    );
}

export default CustomLayout;