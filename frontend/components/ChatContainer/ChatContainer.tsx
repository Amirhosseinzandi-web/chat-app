"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore, type MessagesType, type UsersType } from "@/store/useChatStore";
import { Forward, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";
import ChatHeader from "../ChatHeader/ChatHeader";
import MessageInput from "../MessageInput/MessageInput";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import MessageOptionsModal from "../MessageOptionsModal/MessageOptionsModal";
import UserProfileModal from "../UserProfileModal/UserProfileModal";
import MessageRow from "../Message/MessageRow";
import PhotoViewer from "../shared/PhotoViewer";

const ChatContainerComponent = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser, subscribeToNewMessages, unsubscribeFromNewMessages, users } = useChatStore();
    const { authUser, onlineUsers } = useAuthStore();

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // ---- shared profile system: every avatar opens the same panel ----
    const [profileId, setProfileId] = useState<string | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);

    // ---- message actions ----
    const [deleteFor, setDeleteFor] = useState<MessagesType | null>(null);
    const [forwarding, setForwarding] = useState<MessagesType | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const selecting = selectedIds.size > 0;

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id);
            subscribeToNewMessages();
        }
        // switching chats leaves selection mode (like Telegram)
        setSelectedIds(new Set());
        return () => unsubscribeFromNewMessages();
    }, [selectedUser]);

    useEffect(() => {
        const t = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(t);
    }, [messages]);

    // Escape exits selection mode / closes viewer
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && selecting) setSelectedIds(new Set());
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selecting]);

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                <ChatHeader onOpenProfile={() => selectedUser && setProfileId(selectedUser._id)} />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    const isSaved = !!selectedUser && selectedUser._id === authUser?._id;
    const otherUserPic = isSaved ? "/avatar.png" : selectedUser?.profilePic || "/avatar.png";

    // resolve ANY avatar click to a full user object
    let profileUser: UsersType | null = null;
    if (profileId) {
        if (selectedUser && profileId === selectedUser._id) profileUser = selectedUser;
        else if (authUser && profileId === authUser._id) profileUser = authUser as UsersType;
        else profileUser = users.find((u) => u._id === profileId) || null;
    }

    const toggleSelect = (m: MessagesType) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(m._id)) next.delete(m._id);
            else next.add(m._id);
            return next;
        });
    };

    const onBubbleClick = (m: MessagesType) => {
        // plain click NEVER selects; it only toggles when selection mode is already on
        if (selecting) toggleSelect(m);
    };

    const deleteSelected = async () => {
        const ids = [...selectedIds];
        try {
            await Promise.all(ids.map((id) => axiosInstance.delete("/api/message/" + id, { data: { scope: "me" } })));
            useChatStore.setState((s) => ({ messages: s.messages.filter((m) => !selectedIds.has(m._id)) }));
            setSelectedIds(new Set());
        } catch {
            toast.error("something went wrong");
        }
    };

    const forwardTo = async (target: UsersType) => {
        if (!forwarding) return;
        try {
            const payload: Record<string, string> = {};
            if (forwarding.text) payload.text = forwarding.text;
            if (forwarding.image) payload.image = forwarding.image;
            await axiosInstance.post("/api/message/send/" + target._id, payload);
            toast.success("Forwarded to " + target.fullName);
        } catch {
            toast.error("something went wrong");
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <ChatHeader onOpenProfile={() => selectedUser && setProfileId(selectedUser._id)} />

            {/* Telegram-style selection toolbar */}
            {selecting && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-base-200 border-b border-base-300 overlay-fade">
                    <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setSelectedIds(new Set())} aria-label="Cancel selection">
                        <X className="size-5" />
                    </button>
                    <span className="font-medium text-sm">{selectedIds.size} selected</span>
                    <div className="flex items-center gap-1">
                        <button
                            className="btn btn-ghost btn-sm btn-circle text-error"
                            onClick={deleteSelected}
                            aria-label="Delete selected"
                        >
                            <Trash2 className="size-5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 bg-base-200/40">
                <div className="flex flex-col gap-3 max-w-3xl mx-auto">
                    {messages?.map((item) => (
                        <MessageRow
                            key={item._id}
                            message={item}
                            selected={selectedIds.has(item._id)}
                            selecting={selecting}
                            otherUserPic={otherUserPic}
                            allMessages={messages}
                            onToggleSelect={toggleSelect}
                            onOpenSenderProfile={(senderId) => setProfileId(senderId)}
                            onDelete={(m) => setDeleteFor(m)}
                            onForward={(m) => setForwarding(m)}
                            onBubbleClick={onBubbleClick}
                            onImageClick={(m) => setPhoto(m.image)}
                        />
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>

            <MessageInput />

            {/* shared profile panel - identical for header avatar and message avatars */}
            {profileUser && (
                <UserProfileModal
                    user={profileUser}
                    isSaved={profileUser._id === authUser?._id && isSaved}
                    isOnline={!!profileUser._id && !isSaved && onlineUsers.includes(profileUser._id)}
                    onClose={() => setProfileId(null)}
                />
            )}

            {deleteFor && (
                <MessageOptionsModal
                    message={deleteFor}
                    isOwn={deleteFor.senderId === authUser?._id}
                    onClose={() => setDeleteFor(null)}
                />
            )}

            {/* forward picker: real users from the chat store, real send */}

            {forwarding && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-fade bg-black/40 backdrop-blur-[2px]"
                    onClick={() => setForwarding(null)}
                >
                    <div
                        className="w-full max-w-sm bg-base-100 rounded-2xl shadow-2xl p-4 modal-pop"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Forward className="size-5 text-primary" />
                            <h3 className="font-semibold">Forward to</h3>
                        </div>
                        <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
                            {users.map((u) => (
                                <button
                                    key={u._id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 text-left transition-colors"
                                    onClick={() => forwardTo(u)}
                                >
                                    <img src={u.profilePic || "/avatar.png"} alt={u.fullName} className="size-9 rounded-full object-cover" />
                                    <span className="text-sm truncate">{u.fullName}</span>
                                </button>
                            ))}
                            {users.length === 0 && (
                                <p className="text-sm text-base-content/60 p-2">No chats yet</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {photo && <PhotoViewer src={photo} onClose={() => setPhoto(null)} />}
        </div>
    );
};

export default ChatContainerComponent;
