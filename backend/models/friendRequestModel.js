import mongoose from "mongoose";

// A one-shot connection request: A asks B to connect, B accepts or rejects.
// Being accepted is what makes two users real contacts (and allows chatting).
const friendRequestSchema = new mongoose.Schema(
    {
        // who asks
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userModel",
            required: true,
        },
        // who is asked
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userModel",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true }
);

// one request per direction per pair (re-sending after a rejection reuses the row)
friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
// the inbox query: pending requests for me, newest first
friendRequestSchema.index({ receiverId: 1, status: 1, createdAt: -1 });

const friendRequestModel = mongoose.model("friendRequestModel", friendRequestSchema, "friendrequests");

export default friendRequestModel;
