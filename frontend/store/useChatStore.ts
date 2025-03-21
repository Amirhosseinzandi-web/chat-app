import { axiosInstance, customInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { create } from "zustand";
import { useAuthStore } from "@/store/useAuthStore";



type UsersType = {
    _id: string
    email: string
    password: string
    profilePic: string
    fullName: string
    tokens: [{ tokenKey: string, time: string }]
}

type MessagesType = {
    _id: string
    senderId: string
    receiverId: string
    text: string
    image: string
    createdAt: string
}



type ChatStoreType = {
    messages: MessagesType[]
    users: UsersType[],
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
}



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
            set({ messages: res.data })
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
            set({ messages: [...messages, res.data] })
            // get().subscribeToNewMessages()
            // console.log(res);


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


        const handler = (newMessage: MessagesType) => {
            if (newMessage.senderId !== selectedUser._id) return
            set((state) => ({ messages: [...state.messages, newMessage] }));
        };

        socket.on("newMessage", handler);
    },


    unsubscribeFromNewMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return
        socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),
}))