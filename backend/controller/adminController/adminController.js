import messageModel from "../../models/messageModel.js";
import userModel from "../../models/userModel.js";
import { getUserSocketMap } from "../../lib/socket.js";




// GET /api/admin/stats
export const getStats = async (req, res) => {
    try {
        const [userCount, messageCount] = await Promise.all([
            userModel.countDocuments({}),
            messageModel.countDocuments({}),
        ]);
        const onlineCount = Object.keys(getUserSocketMap()).length;

        res.status(200).json({ users: userCount, messages: messageCount, online: onlineCount });
    } catch (err) {
        console.log(`error in admin getStats, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}



// GET /api/admin/users
export const listUsers = async (req, res) => {
    try {
        const users = await userModel.find({}).select("_id fullName email role profilePic createdAt").sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        console.log(`error in admin listUsers, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}



// DELETE /api/admin/user/:id  - deletes the user and ALL their messages
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === String(req.user._id)) {
            return res.status(400).json({ message: "you cannot delete your own admin account from here" });
        }

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }

        await messageModel.deleteMany({
            $or: [{ senderId: id }, { receiverId: id }],
        });
        await userModel.findByIdAndDelete(id);

        console.log(`[admin] user ${id} (${user.email}) and all their messages deleted by ${req.user.email}`);
        res.status(200).json({ message: "user and their messages deleted" });
    } catch (err) {
        console.log(`error in admin deleteUser, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}



// DELETE /api/admin/messages/:userA/:userB - deletes one conversation (both directions)
export const deleteConversation = async (req, res) => {
    try {
        const { userA, userB } = req.params;

        const result = await messageModel.deleteMany({
            $or: [
                { senderId: userA, receiverId: userB },
                { senderId: userB, receiverId: userA },
            ],
        });

        console.log(`[admin] conversation ${userA} <-> ${userB} cleared (${result.deletedCount} messages) by ${req.user.email}`);
        res.status(200).json({ message: "conversation deleted", deleted: result.deletedCount });
    } catch (err) {
        console.log(`error in admin deleteConversation, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}



// POST /api/admin/reset  body: { scope: "messages" | "all", confirm: "DELETE" }
export const resetDatabase = async (req, res) => {
    try {
        const { scope, confirm } = req.body;

        if (confirm !== "DELETE") {
            return res.status(400).json({ message: 'type "DELETE" in confirm to proceed' });
        }

        if (scope === "messages") {
            const result = await messageModel.deleteMany({});
            console.log(`[admin] RESET messages only (${result.deletedCount} deleted) by ${req.user.email}`);
            return res.status(200).json({ message: "all messages deleted", deleted: result.deletedCount });
        }

        if (scope === "all") {
            const msg = await messageModel.deleteMany({});
            const usr = await userModel.deleteMany({ role: { $ne: "admin" } });
            console.log(`[admin] RESET ALL (${msg.deletedCount} messages, ${usr.deletedCount} users) by ${req.user.email}`);
            return res.status(200).json({
                message: "all messages and users (except admins) deleted",
                messages: msg.deletedCount,
                users: usr.deletedCount,
            });
        }

        return res.status(400).json({ message: 'scope must be "messages" or "all"' });
    } catch (err) {
        console.log(`error in admin resetDatabase, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}
