import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

export type PublicUser = {
    _id: string;
    fullName: string;
    username?: string | null;
    profilePic?: string;
    // the backend never sends email to strangers; the field exists so the
    // result can feed the chat store's contact type without a cast
    email?: string;
};

// "incoming" means THEY sent me a request that is still pending
export type RelationState = "none" | "requested" | "incoming" | "connected";

export type AppNotification = {
    _id: string;
    type: "friend-request" | "friend-accepted" | "set-username";
    title: string;
    body?: string;
    read: boolean;
    createdAt: string;
    refId?: string | null;
    fromUserId?: PublicUser | string | null;
};

type FriendStoreType = {
    notifications: AppNotification[];
    unread: number;
    hasUsername: boolean;
    myUsername: string | null;
    isCheckingUsername: boolean;
    isLoadingNotifications: boolean;

    fetchNotifications: () => Promise<void>;
    markNotificationsRead: (id?: string) => Promise<void>;
    checkUsername: (name: string) => Promise<{ available: boolean; reason?: string }>;
    setUsername: (name: string) => Promise<boolean>;
    searchUser: (name: string) => Promise<{ user: PublicUser; state: RelationState } | null>;
    sendRequest: (userId: string) => Promise<boolean>;
    acceptRequest: (requestId: string) => Promise<boolean>;
    rejectRequest: (requestId: string) => Promise<boolean>;
};

export const useFriendStore = create<FriendStoreType>((set, get) => ({
    notifications: [],
    unread: 0,
    hasUsername: false,
    myUsername: null,
    isCheckingUsername: false,
    isLoadingNotifications: false,

    fetchNotifications: async () => {
        set({ isLoadingNotifications: true });
        try {
            const res = await axiosInstance.get("/api/friend/notifications");
            set({
                notifications: res.data.notifications || [],
                unread: res.data.unread || 0,
                hasUsername: !!res.data.hasUsername,
            });
            // keep the auth user in sync so the banner reacts everywhere.
            // ONLY trust a truthy value: the payload can miss the field on old
            // backends, and overwriting with undefined caused "@undefined".
            const me = useAuthStore.getState().authUser;
            if (me && res.data.myUsername && me.username !== res.data.myUsername) {
                useAuthStore.setState({ authUser: { ...me, username: res.data.myUsername } });
            }
            set({ myUsername: res.data.myUsername ?? null });
        } catch (err) {
            console.log("error in fetchNotifications, error is ==> ", err);
        } finally {
            set({ isLoadingNotifications: false });
        }
    },

    markNotificationsRead: async (id) => {
        try {
            await axiosInstance.put("/api/friend/notifications/read", id ? { id } : {});
            set({
                notifications: get().notifications.map((n) =>
                    id && n._id !== id ? n : { ...n, read: true }
                ),
                unread: id
                    ? Math.max(0, get().unread - get().notifications.filter((n) => n._id === id && !n.read).length)
                    : 0,
            });
        } catch (err) {
            console.log("error in markNotificationsRead, error is ==> ", err);
        }
    },

    checkUsername: async (name) => {
        set({ isCheckingUsername: true });
        try {
            const res = await axiosInstance.get("/api/friend/check-username/" + encodeURIComponent(name));
            return res.data;
        } catch {
            return { available: false, reason: "error" };
        } finally {
            set({ isCheckingUsername: false });
        }
    },

    setUsername: async (name) => {
        try {
            const res = await axiosInstance.put("/api/friend/set-username", { username: name });
            const me = useAuthStore.getState().authUser;
            if (me) useAuthStore.setState({ authUser: { ...me, username: res.data.username } });
            set({ hasUsername: true, myUsername: res.data.username });
            toast.success("Your id is @" + res.data.username);
            return true;
        } catch (err) {
            const code = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            if (code === "username-taken") toast.error("That id is already taken");
            else if (code === "reserved-username") toast.error("That id is reserved");
            else if (code === "invalid-username") toast.error("Invalid id format");
            else toast.error("Could not save your id");
            return false;
        }
    },

    searchUser: async (name) => {
        try {
            const res = await axiosInstance.get("/api/friend/search/" + encodeURIComponent(name.replace(/^@/, "")));
            return res.data;
        } catch (err) {
            const status = err as { response?: { status?: number } };
            if (status?.response?.status === 404) toast.error("No one with that id");
            else console.log("error in searchUser, error is ==> ", err);
            return null;
        }
    },

    sendRequest: async (userId) => {
        try {
            await axiosInstance.post("/api/friend/request/" + userId);
            toast.success("Request sent");
            return true;
        } catch (err) {
            console.log("error in sendRequest, error is ==> ", err);
            toast.error("Could not send the request");
            return false;
        }
    },

    acceptRequest: async (requestId) => {
        try {
            await axiosInstance.post("/api/friend/accept/" + requestId);
            toast.success("Connected");
            await get().fetchNotifications();
            return true;
        } catch (err) {
            console.log("error in acceptRequest, error is ==> ", err);
            toast.error("Could not accept the request");
            return false;
        }
    },

    rejectRequest: async (requestId) => {
        try {
            await axiosInstance.post("/api/friend/reject/" + requestId);
            await get().fetchNotifications();
            return true;
        } catch (err) {
            console.log("error in rejectRequest, error is ==> ", err);
            toast.error("Could not reject the request");
            return false;
        }
    },
}));
