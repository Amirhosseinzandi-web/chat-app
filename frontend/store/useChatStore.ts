import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { create } from "zustand";
import { useAuthStore } from "@/store/useAuthStore";



export type UsersType = {
    _id: string
    email: string
    profilePic: string
    fullName: string
    username?: string | null
    createdAt?: string
    // Telegram-style unread badge for this conversation (messages I have not opened)
    unreadCount?: number
}

export type MessagesType = {
    _id: string
    senderId: string
    receiverId: string
    text: string
    image: string
    createdAt: string
    replyTo?: string | null
    edited?: boolean
}



type ChatStoreType = {
    messages: MessagesType[]
    users: UsersType[]
    unreadCounts: Record<string, number>
    fetchUnreadCounts: () => Promise<void>
    applyIncomingUnread: (senderId: string) => void
    resetUnread: (userId: string) => void
    selectedUser: null | UsersType
    isUsersLoading: boolean
    isMessagesLoading: boolean
    isSendingMessage: boolean

    getUsers: () => Promise<void>
    getMessages: (userId: string) => Promise<void>
    setSelectedUser: (selectedUser: null | UsersType) => void
    subscribeToNewMessages: () => void
    unsubscribeFromNewMessages: () => void
    sendMessage: (messageData: Record<string, unknown>) => Promise<void>
    editMessage: (messageId: string, text: string) => Promise<void>
    deleteMessage: (messageId: string, scope: "me" | "all") => Promise<void>
    clearConversation: (scope: "me" | "all") => Promise<void>
}



// merge two message lists, dedupe by _id, sort by createdAt ascending
const mergeMessages = (a: MessagesType[], b: MessagesType[]): MessagesType[] => {
    const map = new Map<string, MessagesType>();
    for (const m of [...a, ...b]) {
        if (m && m._id) map.set(m._id, m);
    }
    return [...map.values()].sort(
        (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
    );
};



export const useChatStore = create<ChatStoreType>((set, get) => ({
    messages: [],
    users: [],
    unreadCounts: {},
    fetchUnreadCounts: async () => {
        try {
            const res = await axiosInstance.get("/api/message/unread");
            set({ unreadCounts: res.data || {} });
        } catch {
            // badges are cosmetic on failure - the next poll/socket event fixes them
        }
    },
    applyIncomingUnread: (senderId) => {
        // idempotent under reloads: the source of truth is refetchUnread below;
        // this optimistic bump just makes the badge react instantly (req. 2+8)
        set((state) => ({
            unreadCounts: { ...state.unreadCounts, [senderId]: (state.unreadCounts[senderId] || 0) + 1 },
        }));
        get().fetchUnreadCounts();
    },
    resetUnread: (userId) => {
        set((state) => {
            if (!state.unreadCounts[userId]) return state;
            const next = { ...state.unreadCounts };
            delete next[userId];
            return { unreadCounts: next };
        });
    },
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    isSendingMessage: false,



    getUsers: async () => {
        set({ isUsersLoading: true })
        try {
            const res = await axiosInstance.get("/api/message/users");
            set({ users: res.data })
        } catch (error) {
            console.log("error in use chat store , get users , error is ==> ", error);
        }
        finally {
            set({ isUsersLoading: false })
        }
    },
    getMessages: async (userId: string) => {
        set({ isMessagesLoading: true })
        try {
            const res = await axiosInstance.get(`/api/message/${userId}`);
            // merge instead of replace so messages arriving during the fetch are not lost
            set({ messages: mergeMessages(get().messages, res.data) })
            // the fetch itself marked the viewed messages as read server-side:
            // reset the badge here so UI and server agree (req. 4+10)
            get().resetUnread(userId);
        }
        catch (error) {
            console.log("error in use chat store , get messages , error is ==> ", error);
            toast.error("something went wrong");
        }
        finally {
            set({ isMessagesLoading: false })
        }
    },
    sendMessage: async (messageData) => {
        set({ isSendingMessage: true })
        const { selectedUser, messages } = get()
        try {
            const res = await axiosInstance.post(`/api/message/send/${selectedUser?._id}`, messageData);
            set({ messages: mergeMessages(messages, [res.data]) })
        } catch {
            toast.error("something went wrong");
        }
        finally {
            set({ isSendingMessage: false })
        }
    },
    subscribeToNewMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // remove any previous listener first so we never stack duplicate handlers
        socket.off("newMessage");

        socket.on("newMessage", (newMessage: MessagesType) => {
            const senderId = String(newMessage.senderId);
            if (selectedUser && senderId === selectedUser._id) {
                // this conversation is OPEN -> the server marks it read on the
                // next getMessages; merge the bubble immediately (req. 8/9)
                set((state) => ({ messages: mergeMessages(state.messages, [newMessage]) }));
                return;
            }
            // conversation closed -> raise their badge (my own messages never
            // reach this client as "newMessage", so req. 5 holds)
            get().applyIncomingUnread(senderId);
        });

        // the other side edited a message -> update it in place
        socket.on("messageEdited", (updated: MessagesType) => {
            set((state) => ({
                messages: state.messages.map((m) => (m._id === updated._id ? { ...m, ...updated } : m)),
            }));
        });

        // a contact changed their name/email/avatar -> refresh every list live
        socket.on("userUpdated", (u: { _id: string; fullName?: string; email?: string; username?: string | null; profilePic?: string }) => {
            set((state) => ({
                users: state.users.map((x) => (x._id === u._id ? { ...x, ...u } : x)),
                selectedUser:
                    state.selectedUser && state.selectedUser._id === u._id
                        ? { ...state.selectedUser, ...u }
                        : state.selectedUser,
            }));
        });
    },


    unsubscribeFromNewMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return
        socket.off("newMessage");
        socket.off("messageEdited");
        socket.off("userUpdated");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser, messages: [] }),

    editMessage: async (messageId, text) => {
        try {
            const res = await axiosInstance.put("/api/message/" + messageId, { text });
            set((state) => ({
                messages: state.messages.map((m) => (m._id === messageId ? res.data : m)),
            }));
        } catch (error) {
            console.log("error in edit message, error is ==> ", error);
            toast.error("something went wrong");
        }
    },

    deleteMessage: async (messageId, scope) => {
        try {
            await axiosInstance.delete(`/api/message/${messageId}`, { data: { scope } });
            get().fetchUnreadCounts();
            // remove it from my view (for "all" the other side gets the socket event)
            set((state) => ({ messages: state.messages.filter((m) => m._id !== messageId) }));
        } catch (error) {
            console.log("error in delete message, error is ==> ", error);
            toast.error("something went wrong");
        }
    },

    clearConversation: async (scope) => {
        const { selectedUser } = get();
        const { authUser } = useAuthStore.getState();
        try {
            // :id = the other side; for Saved Messages selectedUser is yourself
            const otherId = selectedUser?._id ?? authUser?._id;
            if (!otherId) return;
            await axiosInstance.delete(`/api/message/clear/${otherId}`, { data: { scope } });
            get().fetchUnreadCounts();
            set({ messages: [] });
        } catch (error) {
            console.log("error in clear conversation, error is ==> ", error);
            toast.error("something went wrong");
        }
    },

}))
