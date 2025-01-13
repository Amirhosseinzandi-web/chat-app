"use client"

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";





const LoginComponent = () => {
    const { authUser } = useAuthStore();
    const router = useRouter();


   



    return (
        <div>
            this is login component
        </div>
    );
}

export default LoginComponent;