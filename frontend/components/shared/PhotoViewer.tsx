"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
    src: string;
    alt?: string;
    onClose: () => void;
};

/** Full-screen photo viewer (shared by profile pictures and message images). */
const PhotoViewer = ({ src, alt, onClose }: Props) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[60] bg-[#070C20]/95 backdrop-blur-xl overlay-fade flex items-center justify-center p-4"
            onClick={onClose}
        >
            <button
                className="absolute top-3 right-3 btn btn-circle btn-ghost text-white"
                onClick={onClose}
                aria-label="Close"
            >
                <X className="size-6" />
            </button>
            <img
                src={src}
                alt={alt || "photo"}
                className="max-h-full max-w-full object-contain modal-pop"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
};

export default PhotoViewer;
