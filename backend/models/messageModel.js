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
            type: String,
            required: true
        },
        image: {
            type: String
        }
    },
    { timestamps: true }
)



const messageModel = mongoose.model("messageModel", messageSchema, "messages");


export default messageModel