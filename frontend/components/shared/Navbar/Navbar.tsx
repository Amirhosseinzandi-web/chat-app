"use client"
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";






const Navbar = () => {
    const { authUser, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();

    }, [checkAuth])

    console.log(authUser);



    return (
        <div>
            this is navbar
        </div>
    );
}

export default Navbar;