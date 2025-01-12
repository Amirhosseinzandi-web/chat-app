"use client"

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";



const SignUpComponent = () => {
    const { authUser, isCheckingAuth, checkAuth } = useAuthStore()
    const router = useRouter();



    return (
        <div>
            this is signup
        </div>
    );
}

export default SignUpComponent;