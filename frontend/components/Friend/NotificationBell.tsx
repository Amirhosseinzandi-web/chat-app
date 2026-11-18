"use client";

import { useFriendStore, type AppNotification } from "@/store/useFriendStore";
import { useChatStore } from "@/store/useChatStore";
import { Bell, Check, X } from "lucide-react";
import { useEffect, useState } from "react";

const NotificationBell = () => {
    const { notifications, unread, fetchNotifications, acceptRequest, rejectRequest, markNotificationsRead } = useFriendStore();
    const { getUsers } = useChatStore();
    const [open, setOpen] = useState(false);

    // poll so the badge feels alive without a second socket channel
    useEffect(() => {
        fetchNotifications();
        const iv = setInterval(fetchNotifications, 20000);
        return () => clearInterval(iv);
    }, [fetchNotifications]);

    const toggle = () => {
        setOpen((o) => !o);
        if (!open && unread > 0) markNotificationsRead();
    };

    const onAccept = async (n: AppNotification) => {
        const ok = await acceptRequest(n._id);
        // the new contact belongs in the chat list right away
        if (ok) await getUsers();
    };

    return (
        <div className="relative">
            <button
                className="btn btn-sm btn-ghost btn-circle"
                onClick={toggle}
                aria-label="Notifications"
            >
                <Bell className="size-5" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-error text-error-content"
                        style={{ fontSize: 10, lineHeight: "16px" }}>
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-11 z-50 w-72 glass-panel rounded-xl p-2 menu-pop">
                        <p className="px-2 py-1 text-xs font-medium opacity-60">Notifications</p>
                        {notifications.length === 0 && (
                            <p className="px-2 py-4 text-sm text-center text-dim">Nothing here yet</p>
                        )}
                        <div className="max-h-80 overflow-y-auto space-y-1">
                            {notifications.map((n) => (
                                <div key={n._id} className="glass-soft rounded-lg p-2">
                                    <p className="text-sm text-pearl">{n.title}</p>
                                    {n.type === "friend-request" && (
                                        <div className="flex gap-1.5 mt-2">
                                            <button
                                                className="btn btn-primary btn-xs gap-1 flex-1"
                                                onClick={() => onAccept(n)}
                                                disabled={n.read}
                                            >
                                                <Check className="size-3" /> Accept
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-xs gap-1 flex-1"
                                                onClick={() => rejectRequest(n._id)}
                                                disabled={n.read}
                                            >
                                                <X className="size-3" /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
