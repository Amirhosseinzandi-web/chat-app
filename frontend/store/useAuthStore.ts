import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";


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

    checkAuth: () => Promise<void>

    signUp: (data: {}) => Promise<void>

    logOut: () => Promise<void>

    login: (data: {}) => Promise<void>

    updateProfile: (data: {}) => Promise<void>
}



export const useAuthStore = create<AuthStoreType>((set) => ({
    authUser: null,
    isSigningUp: false,
    isLoginingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],


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
        set({ isSigningUp: true })

        try {
            const res = await axiosInstance.post("/auth/signup", data);

            set({ authUser: res.data })
            toast.success("user created successfully");

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

            await axiosInstance.delete("/auth/logout");

            set({ authUser: null })
            toast.success("logout successfully");


        } catch (err) {
            toast.error("logout failed");
        }
    },

    login: async (data) => {
        set({ isLoginingIn: true })
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data })
            toast.success("login successfully");

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
            const res = await axiosInstance.put("/auth/update-profile", data);
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

}))