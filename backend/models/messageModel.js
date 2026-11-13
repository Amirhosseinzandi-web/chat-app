import mongoose from "mongoose";




const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userModel",
            required: true
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userModel",
            required: true
        },
        text: {
            trim: true,
            type: String,
        },
        image: {
            type: String
        },
        // users who hid this message ONLY for themselves ("delete for me", Telegram-style).
        // The message still exists for the other side.
        deletedFor: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "userModel",
            default: []
        }
    },
    { timestamps: true }
)



const messageModel = mongoose.model("messageModel", messageSchema, "messages");


export default messageModel