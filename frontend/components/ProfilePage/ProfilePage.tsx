"use client";

import { useState } from "react";
import { Camera, Mail, User } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import imageCompression from "browser-image-compression";

const ProfilePageComponent = () => {
    const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
    // auth guard: redirects to /login when there is no user
    const { isCheckingAuth } = useRequireAuth();
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    if (isCheckingAuth || !authUser) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-base-200">
                <span className="loading loading-ring loading-lg"></span>
            </div>
        );
    }




    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const file = e.target.files[0];

        // فشرده‌سازی تصویر
        const options = {
            maxSizeMB: 0.05, // حداکثر حجم فایل: ۵۰ کیلوبایت
            maxWidthOrHeight: 500, // حداکثر عرض یا ارتفاع: ۱۰۲۴ پیکسل
            useWebWorker: true, // استفاده از Web Worker برای بهبود عملکرد
        };

        try {
            const compressedFile = await imageCompression(file, options);

            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);

            reader.onload = async () => {
                const base64Image = reader.result;
                if (typeof base64Image === "string") {
                    setSelectedImg(base64Image);
                    await updateProfile({ profilePic: base64Image });
                } else {
                    console.error("Invalid image data");
                }
            };
        } catch (error) {
            console.error("Error compressing image:", error);
        }
    };

    // useEffect(()=>{
    //     console.log(authUser?.createdAt.split("T")[0]);

    // },[authUser])


    return (
        <div className="min-h-[100dvh] pt-20">
            <div className="max-w-2xl mx-auto p-4 py-8">
                <div className="glass-panel rounded-xl p-6 space-y-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold text-pearl">Profile</h1>
                        <p className="mt-2 text-dim">Your profile information</p>
                    </div>

                    {/* avatar upload section */}

                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <img
                                src={selectedImg || authUser?.profilePic || "/avatar.png"}
                                alt="Profile"
                                className="size-32 rounded-full object-cover border-4 border-white/25 shadow-[0_0_36px_rgb(92_120_245/0.45)]"
                            />
                            <label
                                htmlFor="avatar-upload"
                                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
                            >
                                <Camera className="w-5 h-5 text-base-200" />
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/jpg"
                                    onChange={handleImageUpload}
                                    disabled={isUpdatingProfile}
                                />
                            </label>
                        </div>
                        <p className="text-sm text-dim">
                            {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <div className="text-sm text-dim flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Full Name
                            </div>
                            <p className="px-4 py-2.5 glass-soft rounded-lg text-pearl">{authUser?.fullName}</p>
                        </div>

                        <div className="space-y-1.5">
                            <div className="text-sm text-dim flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email Address
                            </div>
                            <p className="px-4 py-2.5 glass-soft rounded-lg text-pearl">{authUser?.email}</p>
                        </div>
                    </div>

                    <div className="mt-6 glass-soft rounded-xl p-6">
                        <h2 className="text-lg font-medium mb-4 text-pearl">Account Information</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between py-2 border-b border-white/10">
                                <span>Member Since</span>
                                <span>{authUser?.createdAt?.split("T")[0]}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span>Account Status</span>
                                <span className="text-green-500">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ProfilePageComponent;
