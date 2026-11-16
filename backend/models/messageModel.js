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
        },
        // Telegram-style reply: the message this one answers (optional)
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "messageModel",
            default: null
        },
        // set when the sender edited the text
        edited: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
)



const messageModel = mongoose.model("messageModel", messageSchema, "messages");


export default messageModel