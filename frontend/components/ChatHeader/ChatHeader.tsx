"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { ArrowLeft, Bookmark, X } from "lucide-react";


type Props = {
    onOpenProfile: () => void
}


const ChatHeader = ({ onOpenProfile }: Props) => {
    const { selectedUser, setSelectedUser } = useChatStore();
    const { onlineUsers, authUser } = useAuthStore();

    const isSaved = !!selectedUser && selectedUser._id === authUser?._id;
    const isOnline = !!selectedUser?._id && !isSaved && onlineUsers.includes(selectedUser._id);

    const statusClass = isSaved ? "text-base-content/60" : isOnline ? "text-primary" : "text-base-content/70";

    return (
        <div className="p-3 sm:p-4 border-b border-base-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Back button - mobile only (returns to the contact list) */}
                    <button
                        className="btn btn-ghost btn-sm btn-circle lg:hidden -ml-1 shrink-0"
                        onClick={() => setSelectedUser(null)}
                        aria-label="Back to contacts"
                    >
                        <ArrowLeft className="size-5" />
                    </button>

                    {/* Avatar - click opens the profile page */}
                    <button
                        onClick={onOpenProfile}
                        className="avatar shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                        aria-label="Open profile"
                    >
                        <div className="size-11 rounded-full relative">
                            <img
                                src={isSaved ? "/avatar.png" : selectedUser?.profilePic || "/avatar.png"}
                                alt={selectedUser?.fullName}
                            />
                            {isSaved && (
                                <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-content rounded-full p-1 border-2 border-base-100">
                                    <Bookmark className="size-3" />
                                </span>
                            )}
                        </div>
                    </button>

                    {/* User info */}
                    <div className="min-w-0">
                        <h3 className="font-medium truncate">{isSaved ? "Saved Messages" : selectedUser?.fullName}</h3>
                        <p className={"text-sm " + statusClass}>
                            {isSaved ? "Your personal cloud" : isOnline ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>

                {/* Close button - desktop only */}
                <button
                    className="hidden lg:flex btn btn-ghost btn-circle btn-sm"
                    onClick={() => setSelectedUser(null)}
                    aria-label="Close chat"
                >
                    <X className="size-5" />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
