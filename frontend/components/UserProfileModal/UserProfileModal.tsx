"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore, type UsersType } from "@/store/useChatStore";
import { Bookmark, Mail, Trash2, X } from "lucide-react";
import { useState } from "react";


type Props = {
    user: UsersType
    isSaved: boolean
    isOnline: boolean
    onClose: () => void
}


const UserProfileModal = ({ user, isSaved, isOnline, onClose }: Props) => {
    const { clearConversation } = useChatStore();
    const { authUser } = useAuthStore();
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState<"me" | "all" | null>(null);

    const handleClear = async (scope: "me" | "all") => {
        setBusy(scope);
        await clearConversation(scope);
        setBusy(null);
        setConfirming(false);
        onClose();
    };


    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-fade bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-base-100 rounded-2xl shadow-2xl p-6 modal-pop"
                onClick={(e) => e.stopPropagation()}
            >
                {!confirming ? (
                    <>
                        <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold">Profile</h3>
                            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Close">
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-3 my-6">
                            <div className="relative">
                                <img
                                    src={user.profilePic || "/avatar.png"}
                                    alt={user.fullName}
                                    className="size-24 rounded-full object-cover border-2 border-base-300"
                                />
                                {isSaved && (
                                    <span className="absolute bottom-0 right-0 bg-primary text-primary-content rounded-full p-1.5 border-2 border-base-100">
                                        <Bookmark className="size-4" />
                                    </span>
                                )}
                            </div>

                            <div className="text-center">
                                <div className="text-xl font-semibold">{user.fullName}</div>
                                <div className="text-sm text-base-content/60 mt-0.5">
                                    {isSaved ? "Your personal cloud" : isOnline ? "Online" : "Offline"}
                                </div>
                                {user.email && (
                                    <div className="flex items-center justify-center gap-1.5 text-sm text-base-content/60 mt-2">
                                        <Mail className="size-4" />
                                        <span>{user.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setConfirming(true)}
                            disabled={user._id === authUser?._id && !isSaved}
                            className="btn btn-ghost btn-error w-full gap-2"
                        >
                            <Trash2 className="size-4" />
                            {isSaved ? "Delete all saved messages" : "Clear history"}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold">Clear history?</h3>
                            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Close">
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="text-sm text-base-content/60 mb-5">
                            {isSaved
                                ? "This affects your saved messages only."
                                : "Choose what you want to delete."}
                        </p>

                        <div className="space-y-2">
                            <button
                                onClick={() => handleClear("all")}
                                disabled={!!busy}
                                className="btn btn-error btn-outline w-full"
                            >
                                {busy === "all" ? "Deleting..." : isSaved ? "Delete all" : "Delete for both sides"}
                            </button>
                            <button
                                onClick={() => handleClear("me")}
                                disabled={!!busy}
                                className="btn btn-ghost w-full"
                            >
                                {busy === "me" ? "Clearing..." : "Clear for me only"}
                            </button>
                            <button
                                onClick={() => setConfirming(false)}
                                disabled={!!busy}
                                className="btn btn-ghost w-full"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserProfileModal;
