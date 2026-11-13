import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { io, type Socket } from "socket.io-client";


type User = {
    _id: string;
    profilePic?: string;
    fullName: string;
    email: string;
    createdAt: string;
    role?: "user" | "admin";
};


type AuthStoreType = {
    authUser: null | User
    isSigningUp: boolean
    isLoginingIn: boolean
    isUpdatingProfile: boolean
    isCheckingAuth: boolean
    onlineUsers: string[]
    socket: Socket | null
    // jwt kept in memory only (never localStorage) and used to authenticate the socket
    authToken: string | null

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
    authToken: null,


    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/api/auth/check");

            set({ authUser: res.data })
            get().connectSocket()

        } catch (err) {
            set({ authUser: null })
            console.log("error in use Auth store in check auth , error is ==> ", err);

        }
        finally {
            set({ isCheckingAuth: false })
        }
    },

    signUp: async (data) => {
        set({ isSigningUp: true })

        try {
            const res = await axiosInstance.post("/api/auth/signup", data);
            set({ authToken: res.data.token });

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

            get().disconnectSocket()
            set({ authUser: null, authToken: null })
            toast.success("logout successfully");

        } catch (err) {
            toast.error("logout failed");
        }
    },

    login: async (data) => {
        set({ isLoginingIn: true })
        try {
            const res = await axiosInstance.post("/api/auth/login", data);
            set({ authToken: res.data.token });

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
        }
    },

    connectSocket: () => {
        const { authUser, socket, authToken } = get();
        // idempotent: do not create a second socket if one exists (even while still connecting)
        if (!authUser || socket) return;

        const socketUrl = process.env.NEXT_PUBLIC_CHAT_APP_API_URL;

        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            auth: {
                // server verifies this JWT and derives the userId from it
                token: authToken,
            },
            // legacy fallback (server accepts query identity for now)
            query: {
                userId: authUser._id,
            },
        });

        newSocket.connect();
        set({ socket: newSocket });

        newSocket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });

        newSocket.on("getOnlineUsers", (userId) => {
            set({ onlineUsers: userId })
        });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, onlineUsers: [] });
        }
    },

}))
