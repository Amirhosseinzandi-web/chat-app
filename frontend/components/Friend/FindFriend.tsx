"use client";

import { useFriendStore, type PublicUser, type RelationState } from "@/store/useFriendStore";
import { useState } from "react";
import { AtSign, Loader2, Search, UserPlus, X, MessageSquare } from "lucide-react";

type Props = {
    onClose: () => void;
    onConnected: (user: PublicUser) => void;
};

const FindFriend = ({ onClose, onConnected }: Props) => {
    const { searchUser, sendRequest } = useFriendStore();

    const [query, setQuery] = useState("");
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ user: PublicUser; state: RelationState } | null>(null);
    const [sent, setSent] = useState(false);

    const search = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = query.trim().replace(/^@/, "");
        if (!name) return;
        setBusy(true);
        setResult(null);
        setSent(false);
        const found = await searchUser(name);
        setResult(found);
        setBusy(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 overlay-fade bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-base-100 rounded-2xl shadow-2xl p-5 modal-pop"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-1">
                    <h3 className="text-lg font-semibold ">Find friend</h3>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Close">
                        <X className="size-4" />
                    </button>
                </div>
                <p className="text-sm text-base-content/60 mb-4">
                    Search by the id they shared with you. They have to approve before you can chat.
                </p>

                <form onSubmit={search} className="flex items-center gap-2">
                    <label className="input flex items-center gap-2 flex-1">
                        <AtSign className="size-4 opacity-60" />
                        <input
                            type="text"
                            className="grow"
                            placeholder="friend_id"
                            value={query}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            onChange={(e) => setQuery(e.target.value.replace(/[^a-zA-Z0-9_@]/g, "").toLowerCase())}
                        />
                    </label>
                    <button type="submit" className="btn btn-primary btn-square" disabled={busy || !query.trim()}>
                        {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                    </button>
                </form>

                {result && (
                    <div className="mt-4 flex items-center gap-3 bg-base-200 rounded-xl p-3">
                        <img
                            src={result.user.profilePic || "/avatar.png"}
                            alt={result.user.fullName}
                            className="size-12 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="font-medium truncate ">{result.user.fullName}</div>
                            <div className="text-sm text-base-content/60 truncate">@{result.user.username}</div>
                        </div>

                        {result.state === "connected" ? (
                            <button
                                className="btn btn-sm gap-1.5"
                                onClick={() => { onConnected(result.user); onClose(); }}
                            >
                                <MessageSquare className="size-4" />
                                Message
                            </button>
                        ) : result.state === "requested" || sent ? (
                            <span className="text-xs text-base-content/60">Requested</span>
                        ) : result.state === "incoming" ? (
                            <span className="text-xs text-base-content/60">Asked you</span>
                        ) : (
                            <button
                                className="btn btn-primary btn-sm gap-1.5"
                                onClick={async () => {
                                    const ok = await sendRequest(result.user._id);
                                    if (ok) setSent(true);
                                }}
                            >
                                <UserPlus className="size-4" />
                                Add
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FindFriend;
