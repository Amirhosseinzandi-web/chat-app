import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";



type AuthStoreType = {
    authUser: null | [],
    isSigningUp: boolean,
    isLoginingIn: boolean,
    isUpdatingProfile: boolean,
    isCheckingAuth: boolean,

    checkAuth: () => Promise<void>,

    signUp: (data: {}) => Promise<void>
}



export const useAuthStore = create<AuthStoreType>((set) => ({
    authUser: null,
    isSigningUp: false,
    isLoginingIn: false,
    isUpdatingProfile: false,

    isCheckingAuth: true,
    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");

            set({ authUser: res.data })

        } catch (err) {
            set({ authUser: null })
            // console.log("error in use Auth store , error is ==> ", err);

        }
        finally {
            set({ isCheckingAuth: false })
        }
    },

    signUp: async (data) => {
        try {

            set({ isSigningUp: true })
            const res = await axiosInstance.post("/auth/signup", data);

            set({ authUser: res.data })
            toast.success("user created successfully");

        } catch (err) {
            toast.error("something went wrong");
            set({ isSigningUp: false })
            set({ authUser: null })
            console.log("error in use Auth store sign up , error is ==> ", err);

        }
    }
}))