"use client"

import { useAuthStore } from "@/store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthImagePattern from "../shared/AuthImagePattern";
import { useRouter } from "next/navigation";




const LoginComponent = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const { login, isLoginingIn, authUser, isCheckingAuth } = useAuthStore();

    const router = useRouter();


    useEffect(() => {
        if (!isCheckingAuth) {
            if (authUser) {
                router.push("/")
            } else {
                router.push("/login")
            }
        }
    }, [authUser, isCheckingAuth, router]);



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(formData);
    }


    return (
        <div className="h-screen grid lg:grid-cols-2 items-center">
            {/* Left Side - Form */}
            <div className="flex flex-col justify-center items-center p-6 sm:p-12">
                <div className="w-full max-w-md glass-panel p-8 space-y-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="flex flex-col items-center gap-2 group">
                            <div
                                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/40 to-secondary/30 border border-white/20
                  shadow-[0_0_20px_rgb(92_120_245/0.45)] flex items-center justify-center transition-transform group-hover:scale-105"
                            >
                                <MessageSquare className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold mt-2 text-pearl">Welcome Back</h1>
                            <p className="text-dim">Sign in to your account</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium text-pearl/90">Email</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-base-content/40" />
                                </div>
                                <input
                                    type="email"
                                    className={`input w-full pl-10 glass-soft border-white/10 text-pearl placeholder-white/30 focus:outline-none focus:border-primary/60 focus:shadow-[0_0_0_3px_rgb(92_120_245/0.18)]`}
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium text-pearl/90">Password</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-base-content/40" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`input w-full pl-10 glass-soft border-white/10 text-pearl placeholder-white/30 focus:outline-none focus:border-primary/60 focus:shadow-[0_0_0_3px_rgb(92_120_245/0.18)]`}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-base-content/40" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-base-content/40" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full border-0 shadow-[0_8px_30px_rgb(92_120_245/0.35)] hover:shadow-[0_8px_36px_rgb(92_120_245/0.5)] hover:-translate-y-0.5 transition-all" disabled={isLoginingIn}>
                            {isLoginingIn ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-base-content/60">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="link link-primary text-cyan">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Image/Pattern */}
            <AuthImagePattern
                title={"Welcome back!"}
                subtitle={"Sign in to continue your conversations and catch up with your messages."}
            />
        </div>
    );
};


export default LoginComponent;
