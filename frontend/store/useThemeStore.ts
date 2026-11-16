import { create } from "zustand";

type ThemeStoreType = {
    theme: string;
    setTheme: (theme: string) => void;
}

// only the two Liquid Glass themes are valid; anything older (cupcake/dark/light)
// migrates to the signature dark glass on load
const VALID_THEMES = ["glassdark", "glasslight"];
const storedTheme = (): string => {
    if (typeof window === "undefined") return "glassdark";
    const t = localStorage.getItem("chat-theme");
    return t && VALID_THEMES.includes(t) ? t : "glassdark";
};

export const useThemeStore = create<ThemeStoreType>((set) => ({
    theme: storedTheme(),
    setTheme: (theme) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("chat-theme", theme)
        }
        set({ theme })
    }
}))
