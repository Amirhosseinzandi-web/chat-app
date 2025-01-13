"use client";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";




const HomeComponent = () => {
    const { authUser, isCheckingAuth, checkAuth } = useAuthStore()
    const router = useRouter();


    // useEffect(() => {
    //     if (!authUser) {
    //         router.push("/login")
    //     }
    // }, [authUser])


   

    return (
        <div>
            this is home
        </div>
    );
}

export default HomeComponent;