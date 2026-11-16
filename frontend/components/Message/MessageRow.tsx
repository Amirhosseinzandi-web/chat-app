"use client";

import { formatMessageTime } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { MessagesType } from "@/store/useChatStore";
import { Copy, Forward, ListChecks, Pencil, Reply, Trash2 } from "lucide-react";
import { useComposerStore } from "@/store/useComposerStore";
import type { MessagesType as Msg } from "@/store/useChatStore";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useLongPress } from "@/hooks/useLongPress";

type Pos = { x: number; y: number };

type Props = {
    message: MessagesType;
    /** this message is inside the multi-select set */
    selected: boolean;
    /** multi-select mode is active (some message is selected) */
    selecting: boolean;
    onToggleSelect: (m: MessagesType) => void;
    onOpenSenderProfile: (senderId: string) => void;
    onDelete: (m: MessagesType) => void;
    onForward: (m: MessagesType) => void;
    /** plain click on the bubble (used for select-mode toggling) */
    onBubbleClick: (m: MessagesType) => void;
    onImageClick: (m: MessagesType) => void;
    /** profile picture of the other side of this 1:1 chat (for received bubbles) */
    otherUserPic: string;
    /** full message list (to resolve the reply quote) */
    allMessages: Msg[];
    /** one of the last 3 messages -> menu opens to the middle, above the pointer */
    nearBottom?: boolean;
    /** delete-for-everyone permission (sender only) - drives the Delete item */
    canDeleteForAll?: boolean;
};

type MenuItemProps = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    danger?: boolean;
    onClick: () => void;
};

const MenuItem = ({ icon: Icon, label, danger, onClick }: MenuItemProps) => (
    <button
        onClick={onClick}
        className={
            "flex items-center gap-3 w-full px-3.5 py-2.5 text-sm text-left transition-colors " +
            (danger ? "text-error hover:bg-error/10" : "hover:bg-base-200")
        }
    >
        <Icon className="size-4 shrink-0" />
        <span>{label}</span>
    </button>
);

const MessageRow = ({
    message, selected, selecting,
    onToggleSelect, onOpenSenderProfile, onDelete, onForward, onBubbleClick, onImageClick,
    otherUserPic, allMessages, nearBottom,
}: Props) => {
    const { authUser } = useAuthStore();
    const { setReplyingTo, setEditing } = useComposerStore();
    const [menu, setMenu] = useState<Pos | null>(null);

    const quoted = message.replyTo
        ? allMessages.find((m) => m._id === message.replyTo)
        : null;
    const openedAtRef = useRef(0);

    const isOwn = message.senderId === authUser?._id;

    const openMenu = (pos: Pos) => {
        // in select mode a long press adds/removes instead of opening the menu
        if (selecting) onToggleSelect(message);
        else {
            openedAtRef.current = Date.now();
            setMenu(pos);
        }
    };

    const { handlers, pressing } = useLongPress({ onLongPress: openMenu });

    useEffect(() => {
        if (!menu) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenu(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [menu]);

    const copyText = async () => {
        setMenu(null);
        try {
            await navigator.clipboard.writeText(message.text);
            toast.success("Copied");
        } catch {
            toast.error("Could not copy");
        }
    };

    // keep the floating menu inside the viewport: measure the real menu box
    // (the item count changes with the message type, so estimates go stale)
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [menuPos, setMenuPos] = useState<Pos | null>(null);

    useLayoutEffect(() => {
        if (!menu) { setMenuPos(null); return; }
        const el = menuRef.current;
        const w = el?.offsetWidth ?? 208;
        const h = el?.offsetHeight ?? 240;
        // for the last few messages the user asked for the menu to sit on the
        // opposite side of the bubbles and slightly higher, so it never covers
        // the composer or hugs the screen edge
        let x = menu.x;
        let y = menu.y;
        if (nearBottom) {
            x = isOwn ? menu.x - w - 12 : menu.x + w + 12; // toward the middle
            y = menu.y - h - 12;                            // above the pointer
        }
        const left = Math.max(8, Math.min(x, window.innerWidth - w - 8));
        const top = Math.max(8, Math.min(y, window.innerHeight - h - 8));
        setMenuPos({ x: left, y: top });
    }, [menu, nearBottom, isOwn]);

    return (
        <>
            <div
                className={
                    "chat message-enter " +
                    (isOwn ? "chat-end" : "chat-start") +
                    (selected ? " message-selected" : "") +
                    (pressing ? " message-pressing" : "")
                }
            >
                {/* avatar: opens the SENDER's profile (never selects / opens the message menu) */}
                <div className="chat-image avatar">
                    <div
                        className="size-9 rounded-full border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenSenderProfile(message.senderId);
                        }}
                    >
                        <img
                            src={
                                isOwn
                                    ? authUser?.profilePic || "/avatar.png"
                                    : otherUserPic || "/avatar.png"
                            }
                            alt="sender avatar"
                        />
                    </div>
                </div>

                <div className="chat-header mb-1">
                    <time className="text-xs opacity-50 ml-1">
                        {formatMessageTime(message.createdAt)}
                        {message.edited && <span className="ml-1">(edited)</span>}
                    </time>
                </div>

                {/* the bubble is the long-press target (Telegram behavior) */}
                <div
                    {...handlers}
                    onClick={() => onBubbleClick(message)}
                    onContextMenu={(e) => {
                        e.preventDefault(); // no browser menu; ours instead
                        e.stopPropagation();
                        if (!selecting) setMenu({ x: e.clientX, y: e.clientY });
                    }}
                    style={{ touchAction: "auto" }}
                    className={
                        "chat-bubble rounded-2xl no-touch-callout select-none " +
                        (isOwn
                            ? "bg-primary text-primary-content rounded-br-md"
                            : "bg-base-100 rounded-bl-md")
                    }
                >
                    {quoted && (
                        <div
                            className="mb-1 pl-2 border-l-2 border-current/40 opacity-80 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                const target = allMessages.find((m) => m._id === quoted._id);
                                if (target) {
                                    const el = document.querySelector("[data-message-id='" + target._id + "']");
                                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                                }
                            }}
                        >
                            <div className="text-[11px] font-semibold">
                                {quoted.senderId === authUser?._id ? "You" : "Them"}
                            </div>
                            <div className="text-xs truncate max-w-[180px]">
                                {quoted.text || "📷 Image"}
                            </div>
                        </div>
                    )}
                    {message.image && (
                        <img
                            src={message.image}
                            alt="message image"
                            className="sm:max-w-[220px] rounded-md mb-1 cursor-zoom-in"
                            onClick={(e) => {
                                e.stopPropagation();
                                onImageClick(message);
                            }}
                        />
                    )}
                    {message.text && <p>{message.text}</p>}
                </div>
            </div>

            {/* floating context menu, portaled to <body> so the transformed
                chat panel (chat-panel-enter) can NOT offset position:fixed */}
            {menu && typeof document !== "undefined" &&
                createPortal(
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                            // ignore the synthetic click right after opening (finger release)
                            if (Date.now() - openedAtRef.current < 400) return;
                            setMenu(null);
                        }}
                        onContextMenu={(e) => {
                            // mobile: the OS fires contextmenu onto this overlay
                            // while the finger is still down - swallow it, do NOT close
                            e.preventDefault();
                        }}
                    />
                    <div
                        ref={menuRef}
                        className="fixed z-50 menu-pop w-52 bg-base-100 rounded-xl shadow-2xl border border-base-300 py-1"
                        style={{ left: menuPos?.x ?? menu.x, top: menuPos?.y ?? menu.y }}
                    >
                        <MenuItem
                            icon={Reply}
                            label="Reply"
                            onClick={() => { setMenu(null); setReplyingTo(message); }}
                        />
                        {message.text && (
                            <MenuItem icon={Copy} label="Copy" onClick={copyText} />
                        )}
                        {isOwn && !!message.text && (
                            <MenuItem
                                icon={Pencil}
                                label="Edit"
                                onClick={() => { setMenu(null); setEditing(message); }}
                            />
                        )}
                        <MenuItem
                            icon={Forward}
                            label="Forward"
                            onClick={() => { setMenu(null); onForward(message); }}
                        />
                        <MenuItem
                            icon={ListChecks}
                            label="Select"
                            onClick={() => { setMenu(null); onToggleSelect(message); }}
                        />
                        <MenuItem
                            icon={Trash2}
                            label="Delete"
                            danger
                            onClick={() => { setMenu(null); onDelete(message); }}
                        />
                    </div>
                </>
                ,
                document.body
                )}
        </>
    );
};

export default MessageRow;
