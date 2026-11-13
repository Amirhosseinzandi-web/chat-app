import messageModel from "../../models/messageModel.js";
import userModel from "../../models/userModel.js";
import mongoose from "mongoose";
import { io, getReciverSocketId, getUserSocketMap } from "../../lib/socket.js";





export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await userModel.find({ _id: { $ne: loggedInUserId } }).select("-password");
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log(`error in getUsersForSidebar controller, error is ==> ${error}`);
        return res.status(500).json({ message: "server-error" });
    }
}




export const getMessages = async (req, res) => {
    try {

        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await messageModel.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 })

        res.status(200).json(messages)

    } catch (err) {

        console.log(`error in getMessages controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });

    }
}


export const sendMessage = async (req, res) => {
    try {

        const { text, imageUrl } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        // validation: receiver must be a valid user id and exist; text must have a sane length
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: "invalid receiver id" });
        }
        const receiverExists = await userModel.exists({ _id: receiverId });
        if (!receiverExists) {
            return res.status(404).json({ message: "receiver not found" });
        }
        if (text && typeof text !== "string") {
            return res.status(400).json({ message: "invalid text" });
        }
        if (text && text.length > 2000) {
            return res.status(400).json({ message: "text too long" });
        }
        if (!text && !imageUrl) {
            return res.status(400).json({ message: "message is empty" });
        }


        const newMessage = await messageModel.create({
            senderId,
            receiverId,
            text: text,
            image: imageUrl
        })

        res.status(201).json(newMessage)

        // real time chat
        const receiverSocketid = getReciverSocketId(receiverId)
        const usersSocketMap = getUserSocketMap()
        // console.log("receiverSocketid ==>", receiverSocketid);
        // console.log("usersSocketMap ==>", usersSocketMap);
        // console.log("receiverId ==>", receiverId);
        // console.log("senderId ==>", senderId);


        if (receiverSocketid) {
            io.to(receiverSocketid).emit("newMessage", newMessage)
            // console.log("Emitting new message to receiver:", receiverSocketid);
        }

    } catch (err) {
        console.log(`error in sendMessage controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}