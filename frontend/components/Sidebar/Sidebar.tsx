"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore, type UsersType } from "@/store/useChatStore";
import { Bookmark, Users } from "lucide-react";
import { useEffect, useState } from "react";
import SidebarSkeleton from "../skeletons/SidebarSkeleton";


const SidebarComponent = () => {
    const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const { onlineUsers, authUser } = useAuthStore();

    // the list includes ourselves; count only OTHER online users
    const otherOnlineCount = onlineUsers.filter((id) => id !== authUser?._id).length;


    useEffect(() => {
        getUsers()
    }, [getUsers]);


    const filteredUsers = showOnlineOnly
        ? users.filter((user: UsersType) => onlineUsers.includes(user._id))
        : users;


    if (isUsersLoading) return <SidebarSkeleton />;


    // Saved Messages: a "conversation" with yourself (task: Telegram-style saved messages)
    const savedEntry: UsersType | null = authUser
        ? {
            _id: authUser._id,
            email: authUser.email,
            profilePic: authUser.profilePic || "",
            fullName: "Saved Messages",
        }
        : null;

    const selectedId = selectedUser?._id;


    return (
        // mobile: full-width list; desktop: fixed-width sidebar
        <aside className="h-full w-full lg:w-80 border-r border-white/10 bg-white/[0.04] backdrop-blur-2xl flex flex-col transition-all duration-200">
            <div className="border-b border-white/10 w-full p-5">
                <div className="flex items-center gap-2">
                    <Users className="size-6" />
                    <span className="font-medium">Contacts</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={showOnlineOnly}
                            onChange={(e) => setShowOnlineOnly(e.target.checked)}
                            className="checkbox checkbox-sm"
                        />
                        <span className="text-sm text-pearl/80">Show online only</span>
                    </label>
                    <span className="text-xs text-dim">
                        ({otherOnlineCount} {otherOnlineCount === 1 ? "user" : "users"} online)
                    </span>
                </div>
            </div>

            <div className="overflow-y-auto w-full py-3">
                {/* Saved Messages - always first, like Telegram */}
                {savedEntry && (
                    <button
                        onClick={() => setSelectedUser(savedEntry)}
                        className={
                            "w-full p-3 flex items-center gap-3 glass-item border-0 rounded-none transition-colors " +
                            (selectedId === savedEntry._id ? "is-active" : "")
                        }
                    >
                        <div className="relative shrink-0">
                            <img
                                src={savedEntry.profilePic || "/avatar.png"}
                                alt="Saved Messages"
                                className="size-12 object-cover rounded-full"
                            />
                            <span className="absolute bottom-0 right-0 bg-primary text-primary-content
                                rounded-full p-1 border-2 border-[#101B43] shadow-[0_0_10px_rgb(92_120_245/0.6)]">
                                <Bookmark className="size-3" />
                            </span>
                        </div>
                        <div className="text-left min-w-0">
                            <div className="font-medium truncate text-pearl">Saved Messages</div>
                            <div className="text-sm text-dim">Your personal cloud</div>
                        </div>
                    </button>
                )}

                {filteredUsers.map((user: UsersType) => (
                    <button
                        key={user._id}
                        onClick={() => setSelectedUser(user)}
                        className={
                            "w-full p-3 flex items-center gap-3 glass-item border-0 rounded-none transition-colors " +
                            (selectedId === user._id ? "is-active" : "")
                        }
                    >
                        <div className="relative shrink-0">
                            <img
                                src={user.profilePic || "/avatar.png"}
                                alt={user.fullName}
                                className="size-12 object-cover rounded-full"
                            />
                            {onlineUsers.includes(user._id) && (
                                <span
                                    className="absolute bottom-0 right-0 size-3 bg-emerald-400
                       rounded-full ring-2 ring-[#101B43] shadow-[0_0_8px_rgb(74_222_128/0.8)]"
                                />
                            )}
                        </div>

                        {/* User info - visible on all screen sizes */}
                        <div className="text-left min-w-0">
                            <div className="font-medium truncate text-pearl">{user.fullName}</div>
                            <div className="text-sm text-dim">
                                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                            </div>
                        </div>
                    </button>
                ))}

                {filteredUsers.length === 0 && (
                    <div className="text-center text-dim py-4">
                        {users.length === 0 ? "No contacts yet" : showOnlineOnly ? "No users online" : "No contacts found"}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default SidebarComponent;
