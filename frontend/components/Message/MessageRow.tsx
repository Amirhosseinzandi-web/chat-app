"use client";

import { formatMessageTime } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { MessagesType } from "@/store/useChatStore";
import { Copy, Forward, ListChecks, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
    otherUserPic,
}: Props) => {
    const { authUser } = useAuthStore();
    const [menu, setMenu] = useState<Pos | null>(null);

    const isOwn = message.senderId === authUser?._id;

    const openMenu = (pos: Pos) => {
        // in select mode a long press adds/removes instead of opening the menu
        if (selecting) onToggleSelect(message);
        else setMenu(pos);
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

    // keep the floating menu inside the viewport
    const hasCopy = !!message.text;
    const menuHeight = (hasCopy ? 4 : 3) * 42 + 8;
    const left = Math.max(8, Math.min(menu?.x ?? 0, (typeof window !== "undefined" ? window.innerWidth : 0) - 224));
    const top = Math.max(8, Math.min(menu?.y ?? 0, (typeof window !== "undefined" ? window.innerHeight : 0) - menuHeight - 8));

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
                    </time>
                </div>

                {/* the bubble is the long-press target (Telegram behavior) */}
                <div
                    {...handlers}
                    onClick={() => onBubbleClick(message)}
                    onContextMenu={(e) => {
                        e.preventDefault(); // no browser menu; ours instead
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

            {/* floating context menu (sibling of the row: clicks here never retrigger it) */}
            {menu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenu(null)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setMenu(null);
                        }}
                    />
                    <div
                        className="fixed z-50 menu-pop w-52 bg-base-100 rounded-xl shadow-2xl border border-base-300 py-1"
                        style={{ left, top }}
                    >
                        {message.text && (
                            <MenuItem icon={Copy} label="Copy" onClick={copyText} />
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
            )}
        </>
    );
};

export default MessageRow;
