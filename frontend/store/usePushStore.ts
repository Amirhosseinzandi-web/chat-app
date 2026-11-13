import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";


type PushStoreType = {
    notificationsEnabled: boolean;
    mutedChats: Record<string, boolean>;
    setNotificationsEnabled: (enabled: boolean) => Promise<void>;
    toggleChatMute: (chatId: string) => Promise<void>;
    isChatMuted: (chatId: string) => boolean;
};

// sync from the auth user document (checkAuth returns the full user incl. these fields)
export const syncPushStoreFromAuthUser = () => {
    const { authUser } = useAuthStore.getState();
    if (!authUser) return;
    const u = authUser as unknown as {
        notificationsEnabled?: boolean;
        mutedChats?: Record<string, boolean>;
    };
    usePushStore.setState({
        notificationsEnabled: u.notificationsEnabled !== false,
        mutedChats: u.mutedChats || {},
    });
};

export const usePushStore = create<PushStoreType>((set, get) => ({
    notificationsEnabled: true,
    mutedChats: {},

    setNotificationsEnabled: async (enabled) => {
        try {
            const res = await axiosInstance.put("/api/push/notifications", { enabled });
            set({ notificationsEnabled: enabled });
            // keep the auth store in sync for the socket/server decisions
            useAuthStore.setState((s) => (s.authUser ? { authUser: { ...s.authUser, notificationsEnabled: res.data.notificationsEnabled } } : {}));
        } catch (err) {
            console.log("error setting notifications:", err);
        }
    },

    toggleChatMute: async (chatId) => {
        const currentlyMuted = !!get().mutedChats[chatId];
        const muted = !currentlyMuted;
        try {
            const res = await axiosInstance.put(`/api/push/mute/${chatId}`, { muted });
            const mutedChats = { ...get().mutedChats, ...res.data.mutedChats };
            if (!muted) delete mutedChats[chatId];
            set({ mutedChats });
            useAuthStore.setState((s) => (s.authUser ? { authUser: { ...s.authUser, mutedChats } } : {}));
        } catch (err) {
            console.log("error toggling mute:", err);
        }
    },

    isChatMuted: (chatId) => !!get().mutedChats[chatId],
}));
