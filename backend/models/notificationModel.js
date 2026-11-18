import mongoose from "mongoose";

// In-app notification (the bell inside Chatty - NOT a phone push).
// Created by the server whenever something needs the user's attention:
// a connection request, an accepted request, or the "set your @id" nudge.
const notificationSchema = new mongoose.Schema(
    {
        // who receives it
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userModel",
            required: true,
        },
        type: {
            type: String,
            enum: ["friend-request", "friend-accepted", "set-username"],
            required: true,
        },
        // free-form payload for the UI (requester info, etc.)
        title: { type: String, default: "" },
        body: { type: String, default: "" },
        // the user the notification is about
        fromUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userModel",
            default: null,
        },
        // de-dupe key: e.g. the friend request id, or "set-username" for the nudge
        refId: { type: String, default: null },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
// never stack duplicates of the same attention-grabber for the same user
notificationSchema.index({ userId: 1, type: 1, refId: 1 }, { unique: true, partialFilterExpression: { refId: { $type: "string" } } });

const notificationModel = mongoose.model("notificationModel", notificationSchema, "notifications");

export default notificationModel;
