"use client";

import { useChatStore } from "@/store/useChatStore";
import { useEffect } from "react";
import ChatHeader from "../ChatHeader/ChatHeader";
import MessageInput from "../MessageInput/MessageInput";
import MessageSkeleton from "../skeletons/MessageSkeleton";





const ChatContainerComponent = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser } = useChatStore()

    useEffect(() => {
        if (selectedUser) getMessages(selectedUser._id)
    }, [selectedUser, getMessages])


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

            <p>messages...</p>

            <MessageInput />


        </div>
    );
}

export default ChatContainerComponent;