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
        <div className="rounded-xl border border-info/40 bg-info/10 p-3 m-3">
            <div className="flex items-center gap-2 mb-2">
                <AtSign className="size-4 text-info shrink-0" />
                <p className="text-sm font-semibold flex-1 min-w-0 truncate">
                    Pick your public id so friends can find you
                </p>
                <button
                    className="btn btn-ghost btn-xs btn-circle shrink-0 -mr-1"
                    onClick={() => setDismissed(true)}
                    aria-label="Dismiss"
                >
                    <X className="size-3.5" />
                </button>
            </div>
            <UsernameForm
                initialValue={authUser.username}
                onSaved={() => setDismissed(true)}
            />
        </div>
    );
};

export default UsernameBanner;
