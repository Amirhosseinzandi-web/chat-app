"use client"

import { useChatStore } from "@/store/useChatStore";
import { Image, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";




const MessageInput = () => {
    const [text, setText] = useState("")
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);


    const { sendMessage, messages, isMessagesLoading } = useChatStore();


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file?.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return
        }

        // فشرده‌سازی تصویر
        const options = {
            maxSizeMB: 0.05, // حداکثر حجم فایل: ۵۰ کیلوبایت
            maxWidthOrHeight: 500, // حداکثر عرض یا ارتفاع: ۱۰۲۴ پیکسل
            useWebWorker: true, // استفاده از Web Worker برای بهبود عملکرد
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
            console.log("error in handle image upload in message input component, error is ==> ", err);
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

        if (!text && !imagePreview) return;

        try {

            await sendMessage({ text: text.trim(), imageUrl: imagePreview });
            // clear form
            setText("");
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

        } catch (err) {
            console.log("error in send message in message input component, error is ==> ", err);
        }

    }


    return (
        <div className="p-4 w-full">
            {imagePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                        />
                        <button
                            onClick={removeImage}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
                  flex items-center justify-center"
                            type="button"
                        >
                            <X className="size-3" />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isMessagesLoading}
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
                        className={`hidden sm:flex btn btn-circle
                         ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Image size={20} />
                    </button>
                </div>
                <button
                    type="submit"
                    className="btn btn-sm btn-circle"
                    disabled={!text.trim() && !imagePreview}
                >
                    <Send size={22} />
                </button>
            </form>
        </div>
    );
}

export default MessageInput;