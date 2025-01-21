import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";



type ChatStoreType = {
    messages: [],
    users: any,
    // selectedUser: null | { id: string, fullName: string, profilePic: string },
    selectedUser: any,
    isUsersLoading: boolean,
    isMessagesLoading: boolean,

    getUsers: () => Promise<void>,
    getMessages: (userId: string) => Promise<void>,
    setSelectedUser: (selectedUser: null | { id: string, fullName: string, profilePic: string }) => void
}



export const useChatStore = create<ChatStoreType>((set) => ({
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
    // todo : optimize this one later
    setSelectedUser: (selectedUser) => set({ selectedUser }),
}))