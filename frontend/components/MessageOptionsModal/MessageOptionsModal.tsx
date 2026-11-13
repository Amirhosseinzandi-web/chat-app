"use client";

import { useChatStore, type MessagesType } from "@/store/useChatStore";
import { X } from "lucide-react";
import { useState } from "react";


type Props = {
    message: MessagesType
    isOwn: boolean
    onClose: () => void
}


const MessageOptionsModal = ({ message, isOwn, onClose }: Props) => {
    const { deleteMessage } = useChatStore();
    const [busy, setBusy] = useState<"me" | "all" | null>(null);

    const handle = async (scope: "me" | "all") => {
        setBusy(scope);
        await deleteMessage(message._id, scope);
        setBusy(null);
        onClose();
    };


    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-fade bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-base-100 rounded-2xl shadow-2xl p-5 modal-pop"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">Delete message?</h3>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Close">
                        <X className="size-4" />
                    </button>
                </div>

                {/* small preview of the message being deleted */}
                <div className="text-sm bg-base-300/60 rounded-lg p-3 mb-4 truncate">
                    {message.text || (message.image ? "📷 Image message" : "Message")}
                </div>

                <div className="space-y-2">
                    {isOwn ? (
                        <>
                            <button
                                onClick={() => handle("all")}
                                disabled={!!busy}
                                className="btn btn-error btn-outline w-full"
                            >
                                {busy === "all" ? "Deleting..." : "Delete for everyone"}
                            </button>
                            <button
                                onClick={() => handle("me")}
                                disabled={!!busy}
                                className="btn btn-ghost w-full"
                            >
                                {busy === "me" ? "Deleting..." : "Delete for me"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => handle("me")}
                                disabled={!!busy}
                                className="btn btn-error btn-outline w-full"
                            >
                                {busy === "me" ? "Deleting..." : "Delete for me"}
                            </button>
                            <p className="text-xs text-base-content/50 text-center pt-1">
                                You can&apos;t delete the other person&apos;s messages for everyone.
                            </p>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        disabled={!!busy}
                        className="btn btn-ghost w-full"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessageOptionsModal;
