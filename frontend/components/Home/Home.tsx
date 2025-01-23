"use client";

import ChatContainerComponent from "@/components/ChatContainer/ChatContainer";
import NoChatSelectedComponent from "@/components/NoChatSelected/NoChatSelected";
import SidebarComponent from "@/components/Sidebar/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";



const HomeComponent = () => {
    const { authUser, isCheckingAuth, checkAuth } = useAuthStore()
    const { selectedUser } = useChatStore()
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
        <div className="h-screen bg-base-200">
            <div className="flex items-center justify-center pt-20 px-4">
                <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100dvh-8rem)]">
                    <div className="flex h-full rounded-lg overflow-hidden">
                        <SidebarComponent />

                        {selectedUser ? <ChatContainerComponent /> : <NoChatSelectedComponent />}

                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomeComponent;