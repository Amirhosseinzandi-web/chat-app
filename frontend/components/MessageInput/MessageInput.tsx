"use client"

import { useChatStore } from "@/store/useChatStore";
import { Image as ImageIcon, Loader2, Pencil, Reply, Send, X } from "lucide-react";
import { useComposerStore } from "@/store/useComposerStore";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";




const MessageInput = () => {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imgBusy, setImgBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textRef = useRef<HTMLTextAreaElement | null>(null);


    const { sendMessage, editMessage, isMessagesLoading, isSendingMessage, selectedUser } = useChatStore();
    const { replyingTo, editing, closeComposer } = useComposerStore();


    // FileReader.readAsDataURL fails intermittently in the wild (WebKit detaches
    // file entries, huge raw photos on iOS). One automatic retry usually succeeds.
    const readAsDataUrl = (blob: Blob, retries = 1): Promise<string> =>
        new Promise((resolve, reject) => {
            const attempt = (left: number) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => {
                    if (left > 0) setTimeout(() => attempt(left - 1), 250);
                    else reject(new Error("read failed"));
                };
                reader.readAsDataURL(blob);
            };
            attempt(retries);
        });

    // blob -> small data URL; main-thread fallback when the worker hangs
    const toSmallDataUrl = async (file: File): Promise<string> => {
        const options = { maxSizeMB: 0.05, maxWidthOrHeight: 500, useWebWorker: true };
        try {
            const compressed = await Promise.race([
                imageCompression(file, options),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
            ]);
            if (compressed) return await readAsDataUrl(compressed);
        } catch { /* fall through to the no-worker path */ }
        try {
            // no worker = main thread: slower but immune to the silent worker hang
            const compressed = await Promise.race([
                imageCompression(file, { ...options, useWebWorker: false }),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
            ]);
            if (compressed) return await readAsDataUrl(compressed);
        } catch { /* last resort below */ }
        return await readAsDataUrl(file); // raw (one retry inside)
    };

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
            const dataUrl = await toSmallDataUrl(file);
            setImagePreview(dataUrl);
        } catch (err) {
            console.log("image processing failed, error is ==> ", err);
            toast.error("Could not process the image. Try another one.");
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
