"use client";
import { create } from "zustand";
import type { MessagesType } from "@/store/useChatStore";

type ComposerState = {
    /** message being replied to (shows the preview bar above the input) */
    replyingTo: MessagesType | null;
    /** message being edited (input loads its text, send applies the edit) */
    editing: MessagesType | null;
    setReplyingTo: (m: MessagesType | null) => void;
    setEditing: (m: MessagesType | null) => void;
    /** close whichever composer mode is active */
    closeComposer: () => void;
};

/** Reply / Edit composer state, shared by MessageRow (openers) and MessageInput. */
export const useComposerStore = create<ComposerState>((set) => ({
    replyingTo: null,
    editing: null,
    setReplyingTo: (m) => set({ replyingTo: m, editing: null }),
    setEditing: (m) => set({ editing: m, replyingTo: null }),
    closeComposer: () => set({ replyingTo: null, editing: null }),
}));
