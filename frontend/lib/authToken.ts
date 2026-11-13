const KEY = "chat-app-jwt";

// Stored in localStorage: the httpOnly cookie is cross-site (vercel.app -> onrender.com)
// and iOS Safari blocks it, so the token must survive reloads for checkAuth to work.
export const setAuthToken = (token: string | null) => {
    if (typeof window === "undefined") return;
    try {
        if (token) localStorage.setItem(KEY, token);
        else localStorage.removeItem(KEY);
    } catch {
        // storage unavailable (private mode edge cases) - in-memory still works
    }
};

export const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem(KEY);
    } catch {
        return null;
    }
};
