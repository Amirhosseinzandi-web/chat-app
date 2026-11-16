"use client"

import { useChatStore } from "@/store/useChatStore";
import { Image as ImageIcon, Loader2, Pencil, Reply, Send, X } from "lucide-react";
import { useComposerStore } from "@/store/useComposerStore";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";




const MessageInput = () => {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imgBusy, setImgBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textRef = useRef<HTMLTextAreaElement | null>(null);


    const { sendMessage, editMessage, isMessagesLoading, isSendingMessage, selectedUser } = useChatStore();
    const { replyingTo, editing, closeComposer } = useComposerStore();


    // Decode + downscale to a small JPEG data URL in ONE native pass:
    // Image element (the most battle-tested decoder there is) -> canvas -> toDataURL.
    // No Web Worker (cannot silently hang) and no FileReader on the main path.
    const toSmallDataUrl = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            const fail = (msg: string) => {
                URL.revokeObjectURL(url);
                reject(new Error(msg));
            };
            img.onload = () => {
                try {
                    const max = 500; // matches the old compression target
                    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
                    const w = Math.max(1, Math.round(img.naturalWidth * scale));
                    const h = Math.max(1, Math.round(img.naturalHeight * scale));
                    const canvas = document.createElement("canvas");
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) { fail("canvas unavailable"); return; }
                    ctx.drawImage(img, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
                    URL.revokeObjectURL(url);
                    if (!dataUrl || dataUrl.length < 100) { fail("empty canvas"); return; }
                    resolve(dataUrl);
                } catch {
                    fail("canvas failed");
                }
            };
            img.onerror = () => fail("decode failed");
            img.src = url;
        });

    // last-resort raw read (only reached if canvas itself failed)
    const readAsDataUrl = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("read failed"));
            reader.readAsDataURL(blob);
        });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const file = input.files?.[0];

        if (!file?.type.startsWith("image/")) {
            input.value = "";
            toast.error("Please select an image file.");
            return;
        }

        // IMPORTANT: clear the input in a later task. Resetting it synchronously
        // can detach the File on WebKit/iOS and make reads fail intermittently.
        setTimeout(() => { input.value = ""; }, 0);

        setImgBusy(true);
        try {
            let dataUrl: string;
            try {
                dataUrl = await toSmallDataUrl(file);
            } catch {
                // canvas could not run/decode - try the bytes directly
                dataUrl = await readAsDataUrl(file);
            }
            setImagePreview(dataUrl);
        } catch (err) {
            console.log("image processing failed, error is ==> ", err);
            toast.error("This image format is not supported by your browser.");
        } finally {
            setImgBusy(false);
        }
    }


    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }


    // enter edit mode: load the message text into the box
    useEffect(() => {
        if (editing) {
            setText(editing.text || "");
            textRef.current?.focus();
        }
    }, [editing]);

    // switching chats resets the composer
    useEffect(() => {
        closeComposer();
    }, [selectedUser?._id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        // EDIT mode: apply the edit instead of sending a new message
        if (editing) {
            if (!text.trim() || text.trim() === editing.text) { closeComposer(); return; }
            await editMessage(editing._id, text.trim());
            closeComposer();
            setText("");
            return;
        }

        if (!text.trim() && !imagePreview) return;

        try {
            await sendMessage({
                text: text.trim(),
                imageUrl: imagePreview,
                replyTo: replyingTo?._id || undefined,
            });
            // clear form
            setText("");
            setImagePreview(null);
            closeComposer();
            if (fileInputRef.current) fileInputRef.current.value = "";
            // put the caret back in the box (user-initiated, keyboard already up)
            textRef.current?.focus();
        } catch (err) {
            console.log("error in send message in message input component, error is ==> ", err);
        }
    }


    const canSend = (!!text.trim() || !!imagePreview) && !isSendingMessage && !isMessagesLoading && !imgBusy;


    return (
        <div className="p-3 sm:p-4 w-full border-t border-base-300 bg-base-100">
            {(replyingTo || editing) && (
                <div className="mb-3 flex items-center gap-3 bg-base-200/80 rounded-xl px-3 py-2 border-l-4 border-primary">
                    {editing ? <Pencil className="size-4 shrink-0 text-primary" /> : <Reply className="size-4 shrink-0 text-primary" />}
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-primary">
                            {editing ? "Editing message" : "Replying to " + (replyingTo?.senderId === selectedUser?._id ? selectedUser?.fullName : "yourself")}
                        </div>
                        <div className="text-sm text-base-content/60 truncate">
                            {(editing || replyingTo)?.text || "📷 Image"}
                        </div>
                    </div>
                    <button onClick={closeComposer} className="btn btn-ghost btn-sm btn-circle" aria-label="Cancel">
                        <X className="size-4" />
                    </button>
                </div>
            )}
            {imagePreview && (
                <div className="mb-3 flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Selected image preview"
                            className="w-20 h-20 object-cover rounded-xl border border-base-300"
                        />
                        <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-700 text-white
                   flex items-center justify-center shadow"
                            type="button"
                            aria-label="Remove image"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>
                    <span className="text-sm text-base-content/50">Ready to send</span>
                </div>
            )}

            <form
                onSubmit={handleSendMessage}
                className="flex items-end gap-2"
            >
                <div className="flex-1 bg-base-200 rounded-3xl flex items-end gap-1 px-2 py-1.5
                    focus-within:ring-2 focus-within:ring-primary/40 transition-shadow">
                    <textarea
                        rows={1}
                        className="flex-1 bg-transparent resize-none outline-none px-3 py-2.5
                            text-base max-h-32 placeholder:text-base-content/40"
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            // Enter sends, Shift+Enter = newline (Telegram behavior)
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e as unknown as React.FormEvent);
                            }
                        }}
                        disabled={isMessagesLoading}
                        ref={textRef}
                    />

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                    />

                    <button
                        type="button"
                        aria-label="Attach an image"
                        disabled={imgBusy}
                        className="p-2.5 rounded-full text-zinc-400 hover:text-primary hover:bg-primary/10
                            transition-colors shrink-0 disabled:opacity-50"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {imgBusy
                            ? <Loader2 size={22} className="animate-spin text-primary" />
                            : <ImageIcon size={22} />}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={!canSend}
                    aria-label="Send message"
                    className="size-12 shrink-0 rounded-full flex items-center justify-center
                        text-primary-content shadow-md
                        transition-all duration-150
                        enabled:bg-primary enabled:hover:scale-105 enabled:active:scale-95
                        disabled:bg-base-300 disabled:text-base-content/40"
                >
                    <Send size={20} className="-ml-0.5 mt-0.5" />
                </button>
            </form>
        </div>
    );
}

export default MessageInput;
