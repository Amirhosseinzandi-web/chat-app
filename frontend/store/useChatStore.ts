import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { create } from "zustand";
import { useAuthStore } from "@/store/useAuthStore";



export type UsersType = {
    _id: string
    email: string
    profilePic: string
    fullName: string
    createdAt?: string
}

export type MessagesType = {
    _id: string
    senderId: string
    receiverId: string
    text: string
    image: string
    createdAt: string
}



type ChatStoreType = {
    messages: MessagesType[]
    users: UsersType[]
    selectedUser: null | UsersType
    isUsersLoading: boolean
    isMessagesLoading: boolean
    isSendingMessage: boolean

    getUsers: () => Promise<void>
    getMessages: (userId: string) => Promise<void>
    setSelectedUser: (selectedUser: null | UsersType) => void
    subscribeToNewMessages: () => void
    unsubscribeFromNewMessages: () => void
    sendMessage: (messageData: {}) => Promise<void>
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
        } catch (error) {
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
            // only accept messages from the currently selected contact
            if (newMessage.senderId !== selectedUser._id) return;
            set((state) => ({ messages: mergeMessages(state.messages, [newMessage]) }));
        });
    },


    unsubscribeFromNewMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return
        socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser, messages: [] }),

    deleteMessage: async (messageId, scope) => {
        try {
            await axiosInstance.delete(`/api/message/${messageId}`, { data: { scope } });
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
            set({ messages: [] });
        } catch (error) {
            console.log("error in clear conversation, error is ==> ", error);
            toast.error("something went wrong");
        }
    },

}))
