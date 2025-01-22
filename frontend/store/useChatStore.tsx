import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { create } from "zustand";


type UsersType = {
    _id: string
    email: string
    password: string
    profilePic: string
    fullName: string
    tokens: [{ tokenKey: string, time: string }]
}



type ChatStoreType = {
    messages: {}[],
    users: any,
    selectedUser: null | UsersType,
    isUsersLoading: boolean,
    isMessagesLoading: boolean,

    getUsers: () => Promise<void>,
    getMessages: (userId: string) => Promise<void>,
    setSelectedUser: (selectedUser: null | UsersType) => void
    sendMessage: (messageData: {}) => Promise<void>
}



export const useChatStore = create<ChatStoreType>((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,




    getUsers: async () => {
        set({ isUsersLoading: true })
        try {
            const res = await axiosInstance.get("/message/users");
            set({ users: res.data })
        } catch (error) {
            console.log("error in use chat store , error is ==> ", error);
        }
        finally {
            set({ isUsersLoading: false })
        }
    },
    getMessages: async (userId: string) => {
        set({ isMessagesLoading: true })
        try {
            const res = await axiosInstance.get(`/message/${userId}`);
            set({ messages: res.data })
        }
        catch (error) {
            console.log("error in use chat store , error is ==> ", error);
        }
        finally {
            set({ isMessagesLoading: false })
        }
    },
    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get()
        try {
            const res = await axiosInstance.post(`/message/send/${selectedUser?._id}`, messageData);
            set({ messages: [...messages, res.data] })
        } catch (error) {
            toast.error("something went wrong");
        }
    },
    // todo : optimize this one later
    setSelectedUser: (selectedUser) => set({ selectedUser }),
}))