"use client";

import { useState } from "react";
import { AtSign, Camera, Check, Mail, Pencil, User, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import UsernameForm from "@/components/Friend/UsernameForm";
import imageCompression from "browser-image-compression";

const ProfilePageComponent = () => {
    const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
    // auth guard: redirects to /login when there is no user
    const { isCheckingAuth } = useRequireAuth();
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    // inline profile editing: which field is open, and its draft value
    const [editing, setEditing] = useState<"name" | "email" | "id" | null>(null);
    const [draft, setDraft] = useState("");

    const openEdit = (field: "name" | "email" | "id") => {
        setEditing(field);
        if (field === "name") setDraft(authUser?.fullName || "");
        if (field === "email") setDraft(authUser?.email || "");
    };
    const closeEdit = () => { setEditing(null); setDraft(""); };

    // save a text field (name or email) through the existing auth update call
    const saveField = async () => {
        if (editing === "name") {
            const name = draft.trim();
            if (name.length < 2) { return; }
            await updateProfile({ fullName: name });
        } else if (editing === "email") {
            const mail = draft.trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { return; }
            await updateProfile({ email: mail });
        }
        closeEdit();
    };

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
                <div className="bg-base-300 rounded-xl p-6 space-y-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold ">Profile</h1>
                        <p className="mt-2">Your profile information</p>
                    </div>

                    {/* avatar upload section */}

                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <img
                                src={selectedImg || authUser?.profilePic || "/avatar.png"}
                                alt="Profile"
                                className="size-32 rounded-full object-cover border-4 "
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
                        <p className="text-sm text-zinc-400">
                            {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <div className="text-sm text-zinc-400 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Full Name
                            </div>
                            {editing === "name" ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        className="input input-sm input-bordered w-full"
                                        value={draft}
                                        autoFocus
                                        maxLength={40}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") saveField(); if (e.key === "Escape") closeEdit(); }}
                                    />
                                    <button className="btn btn-sm btn-primary" onClick={saveField} disabled={draft.trim().length < 2}><Check className="size-4" /></button>
                                    <button className="btn btn-sm btn-ghost" onClick={closeEdit}><X className="size-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-2">
                                    <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-1 min-w-0 truncate">{authUser?.fullName}</p>
                                    <button className="btn btn-sm btn-ghost btn-circle shrink-0" onClick={() => openEdit("name")} aria-label="Edit name"><Pencil className="size-4" /></button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="text-sm text-zinc-400 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email Address
                            </div>
                            {editing === "email" ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        className="input input-sm input-bordered w-full"
                                        value={draft}
                                        autoFocus
                                        type="email"
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") saveField(); if (e.key === "Escape") closeEdit(); }}
                                    />
                                    <button className="btn btn-sm btn-primary" onClick={saveField}><Check className="size-4" /></button>
                                    <button className="btn btn-sm btn-ghost" onClick={closeEdit}><X className="size-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-2">
                                    <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-1 min-w-0 truncate">{authUser?.email}</p>
                                    <button className="btn btn-sm btn-ghost btn-circle shrink-0" onClick={() => openEdit("email")} aria-label="Edit email"><Pencil className="size-4" /></button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="text-sm text-zinc-400 flex items-center gap-2">
                                <AtSign className="w-4 h-4" />
                                Public id
                            </div>
                            {editing === "id" ? (
                                <div>
                                    <UsernameForm
                                        initialValue={authUser.username}
                                        onSaved={closeEdit}
                                    />
                                    <button className="btn btn-ghost btn-sm mt-2" onClick={closeEdit}>Cancel</button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-2">
                                    <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-1 min-w-0 truncate">
                                        {authUser.username ? "@" + authUser.username : "not set yet"}
                                    </p>
                                    <button className="btn btn-sm btn-ghost btn-circle shrink-0" onClick={() => openEdit("id")} aria-label="Edit id"><Pencil className="size-4" /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 bg-base-300 rounded-xl p-6">
                        <h2 className="text-lg font-medium  mb-4">Account Information</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between py-2 border-b border-zinc-700">
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
