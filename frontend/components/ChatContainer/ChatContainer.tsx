"use client";

import { formatMessageTime } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore, type MessagesType } from "@/store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "../ChatHeader/ChatHeader";
import MessageInput from "../MessageInput/MessageInput";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import MessageOptionsModal from "../MessageOptionsModal/MessageOptionsModal";
import UserProfileModal from "../UserProfileModal/UserProfileModal";


const ChatContainerComponent = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser, subscribeToNewMessages, unsubscribeFromNewMessages } = useChatStore();
    const { authUser, onlineUsers } = useAuthStore();

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [optionsFor, setOptionsFor] = useState<MessagesType | null>(null);

    // Telegram-style: on touch, a long press (or double tap) on a bubble opens the options
    const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchTimerStart = (e: React.TouchEvent) => {
        touchTimerRef.current = setTimeout(() => {
            // find the message from the element
            const el = e.currentTarget as HTMLElement;
            const id = el.dataset?.messageId;
            if (id) {
                const found = messages.find((m) => m._id === id);
                if (found) setOptionsFor(found);
            }
        }, 450);
    };
    const touchTimerEnd = () => {
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
        }
    };


    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id);
            subscribeToNewMessages();
        }
        return () => {
            unsubscribeFromNewMessages();
        };
    }, [selectedUser]);


    useEffect(() => {
        const scrollToBottom = () => {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        };
        if (messagesEndRef.current && messages) {
            scrollToBottom();
        }
    }, [messages]);


    if (isMessagesLoading)
        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                <ChatHeader onOpenProfile={() => setProfileOpen(true)} />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );


    const isSaved = !!selectedUser && selectedUser._id === authUser?._id;
    const isOnline = !!selectedUser?._id && !isSaved && onlineUsers.includes(selectedUser._id);


    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <ChatHeader onOpenProfile={() => setProfileOpen(true)} />

            {/* message list with comfortable padding (task: no more edge-glued bubbles) */}
            <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 bg-base-200/40">
                <div className="flex flex-col gap-3 max-w-3xl mx-auto">
                    {messages?.map((item) => (
                        <div
                            key={item._id}
                            data-message-id={item._id}
                            onTouchStart={touchTimerStart}
                            onTouchEnd={touchTimerEnd}
                            onTouchMove={touchTimerEnd}
                            onDoubleClick={() => setOptionsFor(item)}
                            className={
                                "chat message-enter cursor-pointer " +
                                (item?.senderId === authUser?._id ? "chat-end" : "chat-start")
                            }
                            title="Click (or long-press on mobile) to delete"
                        >
                            <div className="chat-image avatar">
                                <div className="size-9 rounded-full border">
                                    <img
                                        src={item?.senderId === authUser?._id ? authUser?.profilePic || "/avatar.png" : isSaved ? "/avatar.png" : selectedUser?.profilePic || "/avatar.png"}
                                        alt="profile logo"
                                    />
                                </div>
                            </div>
                            <div className="chat-header mb-1">
                                <time className="text-xs opacity-50 ml-1">
                                    {formatMessageTime(item.createdAt)}
                                </time>
                            </div>
                            <div
                                className={
                                    "chat-bubble rounded-2xl " +
                                    (item?.senderId === authUser?._id
                                        ? "bg-primary text-primary-content rounded-br-md"
                                        : "bg-base-100 rounded-bl-md")
                                }
                            >
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt="message image"
                                        className="sm:max-w-[220px] rounded-md mb-1"
                                    />
                                )}
                                {item.text && <p className="no-touch-callout">{item.text}</p>}
                            </div>
                        </div>
                    ))}
                </div>

                <div ref={messagesEndRef} />
            </div>

            <MessageInput />

            {/* modals */}
            {profileOpen && selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    isSaved={isSaved}
                    isOnline={isOnline}
                    onClose={() => setProfileOpen(false)}
                />
            )}
            {optionsFor && (
                <MessageOptionsModal
                    message={optionsFor}
                    isOwn={optionsFor.senderId === authUser?._id}
                    onClose={() => setOptionsFor(null)}
                />
            )}
        </div>
    );
};

export default ChatContainerComponent;
