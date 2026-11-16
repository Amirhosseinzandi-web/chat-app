"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { ArrowLeft, Bookmark, Bell, BellOff, X } from "lucide-react";
import { usePushStore } from "@/store/usePushStore";


type Props = {
    onOpenProfile: () => void
}


const ChatHeader = ({ onOpenProfile }: Props) => {
    const { selectedUser, setSelectedUser } = useChatStore();
    const { onlineUsers, authUser } = useAuthStore();
    const { mutedChats, toggleChatMute } = usePushStore();

    const isSaved = !!selectedUser && selectedUser._id === authUser?._id;
    const isMuted = !!selectedUser && !isSaved && !!mutedChats[selectedUser._id];
    const isOnline = !!selectedUser?._id && !isSaved && onlineUsers.includes(selectedUser._id);

    const statusClass = isSaved ? "text-dim" : isOnline ? "text-cyan font-medium" : "text-dim";

    return (
        <div className="p-3 sm:p-4 border-b border-white/10 bg-white/[0.05] backdrop-blur-2xl">
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
                                <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-content rounded-full p-1 border-2 border-[#101B43] shadow-[0_0_10px_rgb(92_120_245/0.6)]">
                                    <Bookmark className="size-3" />
                                </span>
                            )}
                        </div>
                    </button>

                    {/* User info */}
                    <div className="min-w-0">
                        <h3 className="font-medium truncate text-pearl">{isSaved ? "Saved Messages" : selectedUser?.fullName}</h3>
                        <p className={"text-sm " + statusClass}>
                            {isSaved ? "Your personal cloud" : isOnline ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Per-chat mute bell - hidden for Saved Messages */}
                    {!isSaved && selectedUser && (
                        <button
                            className={"btn btn-ghost btn-circle btn-sm shrink-0 " + (isMuted ? "text-warning" : "")}
                            onClick={() => toggleChatMute(selectedUser._id)}
                            aria-label={isMuted ? "Unmute notifications" : "Mute notifications"}
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <BellOff className="size-5" /> : <Bell className="size-5" />}
                        </button>
                    )}

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
        </div>
    );
};

export default ChatHeader;
