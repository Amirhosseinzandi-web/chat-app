import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";


type User = {
    _id: string;
    profilePic?: string;
    fullName: string;
    email: string;
    createdAt: string;
};


type AuthStoreType = {
    authUser: null | User
    isSigningUp: boolean
    isLoginingIn: boolean
    isUpdatingProfile: boolean
    isCheckingAuth: boolean
    // task : fix type onlineUsers
    onlineUsers: any
    socket: any

    checkAuth: () => Promise<void>

    signUp: (data: {}) => Promise<void>

    logOut: () => Promise<void>

    login: (data: {}) => Promise<void>

    updateProfile: (data: {}) => Promise<void>

    connectSocket: () => void

    disconnectSocket: () => void
}



export const useAuthStore = create<AuthStoreType>((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoginingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,


    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/api/auth/check");

            set({ authUser: res.data })
            get().connectSocket()

        } catch (err) {
            set({ authUser: null })
            // console.log("error in use Auth store , error is ==> ", err);

        }
        finally {
            set({ isCheckingAuth: false })
        }
    },

    signUp: async (data) => {
        set({ isSigningUp: true })

        try {
            const res = await axiosInstance.post("/api/auth/signup", data);

            set({ authUser: res.data })
            toast.success("user created successfully");
            get().connectSocket()
        } catch (err) {
            toast.error("something went wrong");
            set({ authUser: null })
            console.log("error in use Auth store sign up , error is ==> ", err);
        }
        finally {
            set({ isSigningUp: false })
        }
    },

    logOut: async () => {
        try {

            await axiosInstance.delete("/api/auth/logout");

            set({ authUser: null })
            toast.success("logout successfully");
            get().disconnectSocket()

        } catch (err) {
            toast.error("logout failed");
        }
    },

    login: async (data) => {
        set({ isLoginingIn: true })
        try {
            const res = await axiosInstance.post("/api/auth/login", data);
            set({ authUser: res.data })
            toast.success("login successfully");
            get().connectSocket()

        } catch (err) {
            toast.error("login failed");
        }
        finally {
            set({ isLoginingIn: false })
        }
    },


    updateProfile: async (data) => {

        const loadingToast = toast.loading("updating profile");
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/api/auth/update-profile", data);
            set({ authUser: res.data });
            toast.dismiss(loadingToast);
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("error in update profile:", error);
            toast.dismiss(loadingToast);
            toast.error("Profile update failed");
        } finally {
            set({ isUpdatingProfile: false });
            // toast.dismiss();
        }
    },

    connectSocket: () => {
        const { authUser, socket } = get();
        if (!authUser || socket?.connected) return;

        const newSocket = io("http://localhost:5000", {
            query: {
                userId: authUser._id,
            },
        });
        newSocket.connect();
        set({ socket: newSocket });

        newSocket.on("getOnlineUsers", (userId) => {
            set({ onlineUsers: userId })
            // console.log("online users", userId);

        })

    },

    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect()
    },

}))