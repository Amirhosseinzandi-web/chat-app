import messageModel from "../../models/messageModel.js";
import userModel from "../../models/userModel.js";






export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await userModel.find({ _id: { $ne: loggedInUserId } });
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
        })

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


        const newMessage = await messageModel.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        })

        res.status(201).json(newMessage)

    } catch (err) {
        console.log(`error in sendMessage controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}