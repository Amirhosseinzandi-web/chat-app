"use client";

import ChatContainerComponent from "@/components/ChatContainer/ChatContainer";
import NoChatSelectedComponent from "@/components/NoChatSelected/NoChatSelected";
import SidebarComponent from "@/components/Sidebar/Sidebar";
import { useChatStore } from "@/store/useChatStore";
import { useRequireAuth } from "@/hooks/useRequireAuth";



const HomeComponent = () => {
    // auth guard: redirects to /login when there is no user (checkAuth runs in CustomLayout)
    const { authUser, isCheckingAuth } = useRequireAuth();
    const { selectedUser } = useChatStore();

    if (isCheckingAuth || !authUser) {
        return (
            <div className="h-[100dvh] flex items-center justify-center bg-base-200">
                <span className="loading loading-ring loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-base-200">
            <div className="flex items-center justify-center pt-16 px-0 sm:px-4 h-full">
                <div className="bg-base-100 shadow-cl w-full sm:max-w-6xl sm:rounded-lg h-full sm:h-[calc(100dvh-8rem)]">
                    <div className="flex h-full sm:rounded-lg overflow-hidden">
                        {/* mobile: show list when no chat selected, chat when selected. desktop: always show sidebar */}
                        <div className={selectedUser ? "hidden lg:flex w-full lg:w-auto" : "flex w-full lg:w-auto"}>
                            <SidebarComponent />
                        </div>

                        {selectedUser ? (
                            <div key={selectedUser._id} className="flex-1 flex w-full lg:w-auto chat-panel-enter">
                                <ChatContainerComponent />
                            </div>
                        ) : (
                            <div className="hidden lg:flex flex-1">
                                <NoChatSelectedComponent />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomeComponent;
