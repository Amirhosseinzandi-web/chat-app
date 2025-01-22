"use client";

import { useChatStore } from "@/store/useChatStore";
import { useEffect } from "react";
import ChatHeader from "../ChatHeader/ChatHeader";
import MessageInput from "../MessageInput/MessageInput";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { formatMessageTime } from "@/lib/utils";





const ChatContainerComponent = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser } = useChatStore()
    const { authUser } = useAuthStore()



    useEffect(() => {
        if (selectedUser) getMessages(selectedUser._id)
    }, [selectedUser, getMessages])


    useEffect(() => {
        // Add console log to check messages
        console.log('Messages:', messages)
    }, [messages])

    useEffect(() => {
        console.log('Auth User ID:', authUser?._id)
    }, [authUser])



    if (isMessagesLoading)
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        )


    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />

            <div className="flex-1 flex flex-col overflow-auto">
                {
                    messages?.map((item, ind) => (
                        <div
                            key={ind}
                            className={`chat ${item?.senderId === authUser?._id ? "chat-end" : "chat-start"}`}
                        >
                            <div className="chat-image avatar">
                                <div className="size-10 rounded-full border">
                                    <img
                                        src={item?.senderId === authUser?._id ? authUser?.profilePic || "/avatar.png" : selectedUser?.profilePic || "/avatar.png"}
                                        alt="profile logo"
                                    />
                                </div>
                            </div>
                            <div className="chat-header mb-1">
                                <time className="text-xs opacity-50 ml-1">
                                    {formatMessageTime(item.createdAt)}
                                </time>
                            </div>
                            <div className="chat-bubble flex flex-col">
                                {
                                    item.image && (
                                        <img
                                            src={item.image}
                                            alt="message image"
                                            className="sm:max-w-[200px] rounded-md mb-2"
                                        />
                                    )
                                }
                                {item.text && <p>{item.text}</p>}
                            </div>
                        </div>
                    ))
                }
            </div>

            <MessageInput />


        </div>
    );
}

export default ChatContainerComponent;