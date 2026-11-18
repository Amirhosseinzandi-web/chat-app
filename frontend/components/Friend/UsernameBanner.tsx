"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useFriendStore } from "@/store/useFriendStore";
import { AtSign, X } from "lucide-react";
import { useEffect, useState } from "react";
import UsernameForm from "./UsernameForm";

/**
 * "You have no public id yet" prompt. Accounts that predate @ids (and anyone
 * who skipped it while signing up) land here, since nobody can find them by id
 * until they pick one. Dismissible for a moment, never silently bypassed.
 */
const UsernameBanner = () => {
    const { authUser } = useAuthStore();
    const { hasUsername, fetchNotifications } = useFriendStore();
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (authUser) fetchNotifications();
    }, [authUser, fetchNotifications]);

    const needsId = !!authUser && !authUser.username && !hasUsername;
    if (!needsId || dismissed) return null;

    return (
        <div className="alert alert-info bg-info/10 border-info/40 rounded-xl p-3 mb-3 grid">
            <div className="flex items-start gap-2">
                <AtSign className="size-5 text-info shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold ">Pick your public id</p>
                    <p className="text-xs text-base-content/60 mt-0.5 mb-2">
                        Friends find you by your id - you have not chosen one yet.
                    </p>
                    <UsernameForm
                        initialValue={authUser.username}
                        onSaved={() => setDismissed(true)}
                    />
                </div>
                <button
                    className="btn btn-ghost btn-xs btn-circle shrink-0"
                    onClick={() => setDismissed(true)}
                    aria-label="Dismiss"
                >
                    <X className="size-3" />
                </button>
            </div>
        </div>
    );
};

export default UsernameBanner;
