"use client";

import { useEffect } from "react";
import ChatContainerComponent from "@/components/ChatContainer/ChatContainer";
import NoChatSelectedComponent from "@/components/NoChatSelected/NoChatSelected";
import SidebarComponent from "@/components/Sidebar/Sidebar";
import { useChatStore } from "@/store/useChatStore";
import { useRequireAuth } from "@/hooks/useRequireAuth";



const HomeComponent = () => {
    // auth guard: redirects to /login when there is no user (checkAuth runs in CustomLayout)
    const { authUser, isCheckingAuth } = useRequireAuth();
    const { selectedUser } = useChatStore();

    // notification deep-link: opening the app from a push notification
    // (sw.js navigates to /?cid=<conversationId>) selects that conversation
    useEffect(() => {
        if (!authUser || typeof window === "undefined") return;
        const cid = new URLSearchParams(window.location.search).get("cid");
        if (!cid) return;

        const tryOpen = (): boolean => {
            const { users, setSelectedUser } = useChatStore.getState();
            let target = null;
            if (cid === authUser._id) {
                // Saved Messages (the sidebar builds this entry locally)
                target = {
                    _id: authUser._id,
                    email: authUser.email,
                    profilePic: authUser.profilePic || "",
                    fullName: "Saved Messages",
                };
            } else if (users.length > 0) {
                target = users.find((u) => u._id === cid) || null;
            }
            if (!target) return false;
            if (useChatStore.getState().selectedUser?._id !== cid) {
                setSelectedUser(target);
            }
            // clean the url so a refresh does not force the chat open
            window.history.replaceState(null, "", window.location.pathname);
            return true;
        };

        if (!tryOpen()) {
            // users are still loading (the sidebar fetches them) - retry briefly
            const iv = window.setInterval(() => {
                if (tryOpen()) window.clearInterval(iv);
            }, 400);
            window.setTimeout(() => window.clearInterval(iv), 10000);
            return () => window.clearInterval(iv);
        }
    }, [authUser]);

    // warm start: app is already open and a notification was clicked
    // (the service worker postMessages the conversation id to this window)
    useEffect(() => {
        if (!authUser || typeof window === "undefined") return;
        const tryOpenChat = (cid: string): boolean => {
            const { users, setSelectedUser } = useChatStore.getState();
            let target = null;
            if (cid === authUser._id) {
                target = {
                    _id: authUser._id,
                    email: authUser.email,
                    profilePic: authUser.profilePic || "",
                    fullName: "Saved Messages",
                };
            } else if (users.length > 0) {
                target = users.find((u) => u._id === cid) || null;
            }
            if (!target) return false; // contact list not loaded yet
            if (useChatStore.getState().selectedUser?._id !== cid) setSelectedUser(target);
            return true;
        };
        const openChat = (cid: string) => {
            // retry briefly: the contact list may still be loading
            let attempts = 0;
            const step = () => {
                if (tryOpenChat(cid)) return;
                if (++attempts >= 20) return;
                window.setTimeout(step, 500);
            };
            step();
        };
        const onMsg = (e: MessageEvent) => {
            if (e.data && e.data.type === "CHATTY_OPEN_CHAT") openChat(e.data.conversationId);
        };
        window.addEventListener("message", onMsg);
        return () => window.removeEventListener("message", onMsg);
    }, [authUser]);

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
