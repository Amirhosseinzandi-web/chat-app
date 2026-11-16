"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { MessageSquare, Settings, Shield, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Liquid Glass nav rail (desktop only): logo, primary destinations and the
 * user chip at the bottom - the frame around the conversations list.
 */
const RailNav = () => {
    const { authUser, logOut } = useAuthStore();
    const { setSelectedUser } = useChatStore();
    const router = useRouter();

    const goHome = () => {
        setSelectedUser(null);
        router.push("/");
    };

    return (
        <nav className="hidden lg:flex flex-col items-center gap-3 w-[76px] shrink-0
            border-r border-white/10 bg-white/[0.04] backdrop-blur-2xl py-5">
            {/* logo */}
            <button
                onClick={goHome}
                aria-label="Chatty home"
                className="size-11 rounded-2xl bg-gradient-to-br from-primary/50 to-secondary/40
                    border border-white/25 shadow-[0_0_22px_rgb(92_120_245/0.55)]
                    flex items-center justify-center hover:scale-105 transition-transform"
            >
                <MessageSquare className="size-5 text-primary-content" />
            </button>

            <div className="flex-1 flex flex-col items-center gap-2 mt-2">
                <Link
                    href="/settings"
                    aria-label="Settings"
                    className="size-11 rounded-2xl glass-item border-0 flex items-center justify-center text-pearl"
                >
                    <Settings className="size-5" />
                </Link>
                <Link
                    href="/profile-page"
                    aria-label="Profile"
                    className="size-11 rounded-2xl glass-item border-0 flex items-center justify-center text-pearl"
                >
                    <User className="size-5" />
                </Link>
                {authUser?.role === "admin" && (
                    <Link
                        href="/admin"
                        aria-label="Admin panel"
                        className="size-11 rounded-2xl glass-item border-0 flex items-center justify-center text-pearl"
                    >
                        <Shield className="size-5" />
                    </Link>
                )}
            </div>

            {/* bottom: user chip + logout */}
            <img
                src={authUser?.profilePic || "/avatar.png"}
                alt={authUser?.fullName}
                title={authUser?.fullName}
                className="size-10 rounded-full object-cover border-2 border-white/25
                    shadow-[0_0_16px_rgb(92_120_245/0.4)]"
            />
            <button
                onClick={logOut}
                aria-label="Log out"
                className="size-11 rounded-2xl glass-item border-0 flex items-center justify-center text-pearl/80 hover:text-red-300"
            >
                <LogOut className="size-5" />
            </button>
        </nav>
    );
};

export default RailNav;
