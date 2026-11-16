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
        <aside className="h-full w-full lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
            <div className="border-b border-base-300 w-full p-5">
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
                        <span className="text-sm">Show online only</span>
                    </label>
                    <span className="text-xs text-zinc-500">
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
                            "w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors " +
                            (selectedId === savedEntry._id ? "bg-base-300" : "")
                        }
                    >
                        <div className="relative shrink-0">
                            <img
                                src={savedEntry.profilePic || "/avatar.png"}
                                alt="Saved Messages"
                                className="size-12 object-cover rounded-full"
                            />
                            <span className="absolute bottom-0 right-0 bg-primary text-primary-content
                                rounded-full p-1 border-2 border-base-100">
                                <Bookmark className="size-3" />
                            </span>
                        </div>
                        <div className="text-left min-w-0">
                            <div className="font-medium truncate">Saved Messages</div>
                            <div className="text-sm text-zinc-400">Your personal cloud</div>
                        </div>
                    </button>
                )}

                {filteredUsers.map((user: UsersType) => (
                    <button
                        key={user._id}
                        onClick={() => setSelectedUser(user)}
                        className={
                            "w-full p-3 flex items-center gap-3 " +
                            "hover:bg-base-300 transition-colors " +
                            (selectedId === user._id ? "bg-base-300" : "")
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
                                    className="absolute bottom-0 right-0 size-3 bg-green-500
                       rounded-full ring-2 ring-zinc-900"
                                />
                            )}
                        </div>

                        {/* User info - visible on all screen sizes */}
                        <div className="text-left min-w-0">
                            <div className="font-medium truncate">{user.fullName}</div>
                            <div className="text-sm text-zinc-400">
                                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                            </div>
                        </div>
                    </button>
                ))}

                {filteredUsers.length === 0 && (
                    <div className="text-center text-zinc-500 py-4">
                        {users.length === 0 ? "No contacts yet" : showOnlineOnly ? "No users online" : "No contacts found"}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default SidebarComponent;
