"use client";

import { useFriendStore } from "@/store/useFriendStore";
import { useEffect, useState } from "react";
import { AtSign, Check, Loader2, X } from "lucide-react";

type Props = {
    initialValue?: string | null;
    onSaved?: (username: string) => void;
};

export const USERNAME_RULE = /^[a-z][a-z0-9_]{4,31}$/;

/**
 * Telegram-style @id picker with a live uniqueness check.
 * Used both while signing up and from the "you have no id yet" banner.
 */
const UsernameForm = ({ initialValue, onSaved }: Props) => {
    const { checkUsername, setUsername } = useFriendStore();
    const [value, setValue] = useState(initialValue || "");
    const [state, setState] = useState<"idle" | "checking" | "free" | "taken" | "invalid" | "reserved" | "saving">(
        initialValue ? "free" : "idle"
    );

    const clean = value.trim().toLowerCase();
    const locallyValid = USERNAME_RULE.test(clean);

    // debounce the remote check so typing does not hammer the API
    useEffect(() => {
        if (!clean) { setState("idle"); return; }
        if (!locallyValid) { setState("invalid"); return; }

        setState("checking");
        const t = setTimeout(async () => {
            const res = await checkUsername(clean);
            if (res.available) setState("free");
            else if (res.reason === "reserved") setState("reserved");
            else if (res.reason === "invalid") setState("invalid");
            else setState("taken");
        }, 450);

        return () => clearTimeout(t);
    }, [clean, locallyValid, checkUsername]);

    const save = async () => {
        setState("saving");
        const ok = await setUsername(clean);
        if (ok) {
            onSaved?.(clean);
        } else {
            setState("taken");
        }
    };

    const message =
        state === "checking" ? "Checking availability..." :
            state === "free" ? "@" + clean + " is available" :
                state === "taken" ? "That id is already taken" :
                    state === "reserved" ? "This id is reserved" :
                        state === "invalid" ? "5-32 chars, start with a letter, a-z 0-9 _" :
                            "";

    const icon =
        state === "checking" || state === "saving" ? <Loader2 className="size-4 animate-spin" /> :
            state === "free" ? <Check className="size-4 text-success" /> :
                state === "idle" ? <AtSign className="size-4 opacity-50" /> :
                    <X className="size-4 text-error" />;

    return (
        <div className="w-full">
            <label className="input flex items-center gap-2 w-full">
                <span className="opacity-60">@</span>
                <input
                    type="text"
                    className="grow"
                    placeholder="your_id"
                    value={value}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={32}
                    onChange={(e) => setValue(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                />
                {icon}
            </label>

            <div className="mt-2 flex items-center justify-between gap-3">
                <span className={
                    "text-xs " +
                    (state === "free" ? "text-success" :
                        state === "invalid" || state === "taken" || state === "reserved" ? "text-error" : "opacity-60")
                }>
                    {message}
                </span>
                <button
                    className="btn btn-sm btn-primary"
                    type="button"
                    disabled={state !== "free" && state !== "saving"}
                    onClick={save}
                >
                    {state === "saving" ? "Saving..." : "Set id"}
                </button>
            </div>
        </div>
    );
};

export default UsernameForm;
