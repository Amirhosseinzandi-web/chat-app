import { create } from "zustand";

type ThemeStoreType = {
    theme: any;
    setTheme: (theme: string) => void;
}




export const useThemeStore = create<ThemeStoreType>((set) => ({
    theme: typeof window !== "undefined" ? localStorage.getItem("chat-theme") : "cupcake",
    setTheme: (theme) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("chat-theme", theme)
        }
        set({ theme })
    }
}))