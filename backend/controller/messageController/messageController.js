import messageModel from "../../models/messageModel.js";
import userModel from "../../models/userModel.js";
import mongoose from "mongoose";
import { io, getReciverSocketId, getUserSocketMap } from "../../lib/socket.js";
import { pushMessageIfOffline } from "../pushController/pushController.js";





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

        // hide messages the viewer deleted "for me"
        const visible = messages.filter((m) => !m.deletedFor?.some((id) => id.equals(myId)))
        res.status(200).json(visible)

    } catch (err) {

        console.log(`error in getMessages controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });

    }
}


export const sendMessage = async (req, res) => {
    try {

        const { text, imageUrl, replyTo } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        // validation: receiver must be a valid user id and exist; text must have a sane length
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: "invalid receiver id" });
        }
        const receiver = await userModel.findById(receiverId).select("_id notificationsEnabled mutedChats");
        if (!receiver) {
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

        // optional reply target must be a real message of THIS conversation
        let replyToId = null;
        if (replyTo) {
            if (!mongoose.Types.ObjectId.isValid(replyTo)) {
                return res.status(400).json({ message: "invalid replyTo id" });
            }
            const target = await messageModel.findById(replyTo).select("_id senderId receiverId deletedFor");
            const visibleToMe = target && !target.deletedFor?.some((x) => x.equals(senderId));
            const inConversation = target && (target.senderId.equals(senderId) || target.receiverId.equals(senderId));
            if (!visibleToMe || !inConversation) {
                return res.status(400).json({ message: "reply target not found" });
            }
            replyToId = target._id;
        }

        const newMessage = await messageModel.create({
            senderId,
            receiverId,
            text: text,
            image: imageUrl,
            replyTo: replyToId
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
            // receiver is online -> real-time socket delivery
            io.to(receiverSocketid).emit("newMessage", newMessage)
        } else {
            // receiver is OFFLINE -> web push notification to all their devices
            // (honors app-level and per-chat mute; fire-and-forget)
            pushMessageIfOffline(receiver, newMessage).catch((e) =>
                console.log("offline push failed:", e.message)
            );
        }

    } catch (err) {
        console.log(`error in sendMessage controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}



// DELETE /api/message/:id   body: { scope: "me" | "all" }
// scope "me"  -> hides the message only for the current user (Telegram "delete for me")
// scope "all" -> deletes it for both sides (Telegram "delete for everyone").
// Rules (like Telegram):
//   - you can always delete your OWN messages (both scopes).
//   - you can delete "for me" any message in the conversation.
//   - "for everyone" on the OTHER person's message is NOT allowed here (Telegram only allows
//     it within 48h and only your own). We keep it simple: own messages only for "all".
export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { scope } = req.body; // "me" | "all"
        const myId = req.user._id;

        if (!["me", "all"].includes(scope)) {
            return res.status(400).json({ message: "invalid scope" });
        }

        const message = await messageModel.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "message not found" });
        }

        // must be part of this user's conversation
        const isInConversation = message.senderId.equals(myId) || message.receiverId.equals(myId);
        if (!isInConversation) {
            return res.status(403).json({ message: "not your message" });
        }

        if (scope === "all") {
            // only the sender can delete for everyone
            if (!message.senderId.equals(myId)) {
                return res.status(403).json({ message: "you can only delete your own messages for everyone" });
            }
            await messageModel.findByIdAndDelete(messageId);

            // notify the other side in real time
            const otherId = message.senderId.equals(myId) ? message.receiverId : message.senderId;
            const otherSocket = getReciverSocketId(String(otherId));
            if (otherSocket) {
                io.to(otherSocket).emit("messageDeleted", { messageId, scope: "all" });
            }
        } else {
            // "me": add to deletedFor (idempotent)
            if (!message.deletedFor.some((x) => x.equals(myId))) {
                message.deletedFor.push(myId);
                await message.save();
            }
            // no socket emit needed: only the current user's view changes
        }

        res.status(200).json({ message: "deleted", scope });
    } catch (err) {
        console.log(`error in deleteMessage controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}




// DELETE /api/message/clear/:id   body: { scope: "me" | "all" }
// Telegram-style "clear history" for a whole conversation.
// :id is the other user's id, OR your own id for Saved Messages.
// scope "me"  -> hides every message in the conversation for you only.
// scope "all" -> deletes every message in the conversation for both sides.
export const clearConversation = async (req, res) => {
    try {
        const { id: otherId } = req.params;
        const { scope } = req.body;
        const myId = req.user._id;

        if (!["me", "all"].includes(scope)) {
            return res.status(400).json({ message: "invalid scope" });
        }

        const isSaved = String(otherId) === String(myId);

        if (!isSaved && !mongoose.Types.ObjectId.isValid(otherId)) {
            return res.status(400).json({ message: "invalid user id" });
        }

        const query = isSaved
            ? { senderId: myId, receiverId: myId }
            : {
                $or: [
                    { senderId: myId, receiverId: otherId },
                    { senderId: otherId, receiverId: myId },
                ],
            };

        if (scope === "all") {
            const result = await messageModel.deleteMany(query);
            if (!isSaved) {
                const otherSocket = getReciverSocketId(String(otherId));
                if (otherSocket) {
                    io.to(otherSocket).emit("conversationCleared", { peerId: String(myId) });
                }
            }
            return res.status(200).json({ message: "conversation cleared", deleted: result.deletedCount });
        }

        // "me": hide the conversation from my view only
        const result = await messageModel.updateMany(query, { $addToSet: { deletedFor: myId } });
        return res.status(200).json({ message: "conversation cleared for you", updated: result.modifiedCount });
    } catch (err) {
        console.log(`error in clearConversation controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}


// PUT /api/message/:id   body: { text }
// Telegram-style edit: only the sender, only the text, marks the message "edited".
// The other side gets the change live through the "messageEdited" socket event.
export const editMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { text } = req.body;
        const myId = req.user._id;

        if (typeof text !== "string" || !text.trim()) {
            return res.status(400).json({ message: "text is required" });
        }
        if (text.length > 2000) {
            return res.status(400).json({ message: "text too long" });
        }

        const message = await messageModel.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "message not found" });
        }
        if (!message.senderId.equals(myId)) {
            return res.status(403).json({ message: "you can only edit your own messages" });
        }
        if (message.image && !message.text) {
            return res.status(400).json({ message: "image-only messages cannot be edited" });
        }

        message.text = text.trim();
        message.edited = true;
        await message.save();

        res.status(200).json(message);

        // live update on the other side
        const otherId = message.receiverId.equals(myId) ? message.senderId : message.receiverId;
        const otherSocket = getReciverSocketId(String(otherId));
        if (otherSocket) {
            io.to(otherSocket).emit("messageEdited", message);
        }
    } catch (err) {
        console.log(`error in editMessage controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}
