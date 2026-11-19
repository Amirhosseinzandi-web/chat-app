"use client";

import { useFriendStore, type AppNotification } from "@/store/useFriendStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { Bell, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NotificationBell = () => {
    const { notifications, unread, fetchNotifications, acceptRequest, rejectRequest, markNotificationsRead } = useFriendStore();
    const { getUsers } = useChatStore();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    // poll so the badge stays fresh even without a socket event
    useEffect(() => {
        fetchNotifications();
        const iv = setInterval(fetchNotifications, 20000);
        return () => clearInterval(iv);
    }, [fetchNotifications]);

    // LIVE badge: the server pushes a notification the moment it is created
    useEffect(() => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        const onNew = () => fetchNotifications();
        socket.on("newNotification", onNew);
        return () => {
            socket.off("newNotification", onNew);
        };
    }, [fetchNotifications]);

    // close on ANY click outside this component, or on Escape
    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("touchstart", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("touchstart", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const toggle = () => {
        const opening = !open;
        setOpen(opening);
        if (opening && unread > 0) markNotificationsRead();
    };

    const onAccept = async (n: AppNotification) => {
        if (!n.refId) return;
        const ok = await acceptRequest(n.refId);
        // the new contact belongs in the chat list right away
        if (ok) await getUsers();
    };

    return (
        <div className="relative" ref={rootRef}>
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
                    <div className="absolute right-0 top-11 z-50 w-72 bg-base-100 rounded-xl shadow-2xl border border-base-300 p-2 menu-pop">
                        <p className="px-2 py-1 text-xs font-medium opacity-60">Notifications</p>
                        {notifications.length === 0 && (
                            <p className="px-2 py-4 text-sm text-center text-base-content/60">Nothing here yet</p>
                        )}
                        <div className="max-h-80 overflow-y-auto space-y-1">
                            {notifications.map((n) => (
                                <div key={n._id} className="bg-base-200 rounded-lg p-2">
                                    <p className="text-sm ">{n.title}</p>
                                    {n.type === "friend-request" && (
                                        <div className="flex gap-1.5 mt-2">
                                            <button
                                                className="btn btn-primary btn-xs gap-1 flex-1"
                                                onClick={() => onAccept(n)}
                                                disabled={!n.refId}
                                            >
                                                <Check className="size-3" /> Accept
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-xs gap-1 flex-1"
                                                onClick={() => n.refId && rejectRequest(n.refId)}
                                                disabled={!n.refId}
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
