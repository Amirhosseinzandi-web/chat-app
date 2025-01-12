"use client";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";




const HomeComponent = () => {
    const { authUser, isCheckingAuth, checkAuth } = useAuthStore()
    const router = useRouter();


    useEffect(() => {
        checkAuth()
    }, [])

    // useEffect(() => {
    //     if (!authUser) {
    //         router.push("/login")
    //     }
    // }, [authUser])


    if (isCheckingAuth) {
        return <span className="loading loading-ring loading-lg absolute top-1/2 left-1/2"></span>
    }

    return (
        <div>
            this is home
        </div>
    );
}

export default HomeComponent;