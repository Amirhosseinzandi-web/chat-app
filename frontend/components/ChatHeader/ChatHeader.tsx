"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { ArrowLeft, X } from "lucide-react";




const ChatHeader = () => {
    const { selectedUser, setSelectedUser } = useChatStore();
    const { onlineUsers } = useAuthStore();

    return (
        <div className="p-2.5 border-b border-base-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Back button - mobile only (returns to the contact list) */}
                    <button
                        className="btn btn-ghost btn-sm btn-circle lg:hidden -ml-1"
                        onClick={() => setSelectedUser(null)}
                        aria-label="Back to contacts"
                    >
                        <ArrowLeft className="size-5" />
                    </button>

                    {/* Avatar */}
                    <div className="avatar">
                        <div className="size-10 rounded-full relative">
                            <img src={selectedUser?.profilePic || "/avatar.png"} alt={selectedUser?.fullName} />
                        </div>
                    </div>

                    {/* User info */}
                    <div>
                        <h3 className="font-medium">{selectedUser?.fullName}</h3>
                        <p className="text-sm text-base-content/70">
                            {!!selectedUser?._id && onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>

                {/* Close button - desktop only */}
                <button className="hidden lg:block" onClick={() => setSelectedUser(null)} aria-label="Close chat">
                    <X />
                </button>
            </div>
        </div>
    );
};
export default ChatHeader;
