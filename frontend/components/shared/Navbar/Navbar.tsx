"use client"
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { LogOut, MessageSquare, Settings, Shield, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";






const Navbar = () => {
    const { authUser, logOut } = useAuthStore();
    const { setSelectedUser } = useChatStore();
    const router = useRouter();

    // clicking the logo always returns to a fresh home view (closes any open chat)
    const goHome = () => {
        setSelectedUser(null);
        router.push("/");
    };




    return (
        <header className="fixed w-full top-0 z-40">
            <div className="absolute inset-0 glass-panel rounded-none border-x-0 border-t-0" />
            <div className="relative">
            <div className="container mx-auto px-4 h-16">
                <div className="flex items-center justify-between h-full">
                    <div className="flex items-center gap-8">
                        <button onClick={goHome} className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-lg font-bold">Chatty</h1>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/settings"
                            className="btn btn-sm gap-2 glass-item border-0 text-pearl"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="hidden sm:inline">Settings</span>
                        </Link>

                        {authUser && (
                            <div className="flex gap-2">
                                {authUser.role === "admin" && (
                                    <Link href="/admin" className="btn btn-sm gap-2 glass-item border-0 text-pearl" aria-label="Admin panel">
                                        <Shield className="size-4" />
                                        <span className="hidden sm:inline">Admin</span>
                                    </Link>
                                )}
                                <Link href="/profile-page" className="btn btn-sm gap-2">
                                    <User className="size-5" />
                                    <span className="hidden sm:inline">Profile</span>
                                </Link>
                                <button className="flex gap-2 items-center glass-item px-3 py-1.5 text-pearl" onClick={logOut}>
                                    <LogOut className="size-5" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        )}

                    </div>


                </div>
            </div>
            </div>
        </header>
    );
}

export default Navbar;