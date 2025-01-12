import { create } from "zustand";
import { axiosInstance } from "@/lib/axios.js";



type AuthStoreType = {
    authUser: null | string,
    isSigningUp: boolean,
    isLoginingIn: boolean,
    isUpdatingProfile: boolean,
    isCheckingAuth: boolean,

    checkAuth: () => Promise<void>
}



export const useAuthStore = create<AuthStoreType>((set) => ({
    authUser: null,
    isSigningUp: false,
    isLoginingIn: false,
    isUpdatingProfile: false,

    isCheckingAuth: true,
    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/get-users");
            console.log(res);

            set({ authUser: res.data })

        } catch (err) {
            set({ authUser: null })
            console.log("error in use Auth store , error is ==> ", err);

        }
        finally {
            set({ isCheckingAuth: false })
        }
    }
}))