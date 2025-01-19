"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";



const HomeComponent = () => {
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

    return (
        <div>
            {/* this is home */}
        </div>
    );
}

export default HomeComponent;