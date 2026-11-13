"use client"

import { useChatStore } from "@/store/useChatStore";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";




const MessageInput = () => {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textRef = useRef<HTMLTextAreaElement | null>(null);


    const { sendMessage, isMessagesLoading, isSendingMessage } = useChatStore();


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file?.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return
        }

        const options = {
            maxSizeMB: 0.05,
            maxWidthOrHeight: 500,
            useWebWorker: true,
        };

        try {
            const compressedFile = await imageCompression(file, options);
            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);

            reader.onload = () => {
                const base64Image = reader.result;
                setImagePreview(base64Image as string);
            };

        } catch (err) {
            // fallback: some browsers (esp. older iOS Safari) fail the worker - use the raw file
            console.log("compression failed, using raw file, error is ==> ", err);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => setImagePreview(reader.result as string);
        }
    }


    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!text.trim() && !imagePreview) return;

        try {
            await sendMessage({ text: text.trim(), imageUrl: imagePreview });
            // clear form
            setText("");
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            // put the caret back in the box (user-initiated, keyboard already up)
            textRef.current?.focus();
        } catch (err) {
            console.log("error in send message in message input component, error is ==> ", err);
        }
    }


    const canSend = (!!text.trim() || !!imagePreview) && !isSendingMessage && !isMessagesLoading;


    return (
        <div className="p-3 sm:p-4 w-full border-t border-base-300 bg-base-100">
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
                        className="p-2.5 rounded-full text-zinc-400 hover:text-primary hover:bg-primary/10
                            transition-colors shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon size={22} />
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
