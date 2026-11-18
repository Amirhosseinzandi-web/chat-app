import mongoose from "mongoose";
import userModel from "../../models/userModel.js";
import friendRequestModel from "../../models/friendRequestModel.js";
import notificationModel from "../../models/notificationModel.js";
import { io, getReciverSocketId } from "../../lib/socket.js";
import { getConnectedUserIds } from "../../lib/connections.js";

// the only fields anyone may ever see about another user
export const PUBLIC_USER_FIELDS = "_id fullName username profilePic";

/** Push a live in-app notification to every open tab of a user. */
export const emitNotification = (userId, notification) => {
    const socketId = getReciverSocketId(String(userId));
    if (socketId) io.to(socketId).emit("newNotification", notification);
};

/** Create (or re-raise) an in-app notification. Never throws into a request. */
export const createNotification = async ({ userId, type, title = "", body = "", fromUserId = null, refId = null }) => {
    try {
        let notification;
        if (refId) {
            // unique (userId, type, refId): a re-send reuses the same row
            notification = await notificationModel.findOneAndUpdate(
                { userId, type, refId },
                { $set: { title, body, fromUserId, read: false }, $setOnInsert: { userId, type, refId } },
                { new: true, upsert: true }
            );
        } else {
            notification = await notificationModel.create({ userId, type, title, body, fromUserId });
        }
        emitNotification(userId, notification);
        return notification;
    } catch (err) {
        console.log(`error while creating a notification, error is ==> ${err}`);
        return null;
    }
};

// @id rules: 5-32 chars, latin letters/digits/underscore, must start with a letter.
// Reserved words keep anyone from impersonating the product or the system.
export const USERNAME_RE = /^[a-z][a-z0-9_]{4,31}$/;
const RESERVED = new Set(["admin", "support", "chatty", "saved", "system", "root", "help", "me", "you", "moderator"]);

export const isUsernameValid = (name) => USERNAME_RE.test(name) && !RESERVED.has(name);

// GET /api/friend/check-username/:name
// Live uniqueness check used by the settings form and the registration form.
export const checkUsername = async (req, res) => {
    try {
        const name = String(req.params.name || "").trim().toLowerCase();
        if (!USERNAME_RE.test(name)) {
            return res.status(200).json({ available: false, reason: "invalid" });
        }
        if (RESERVED.has(name)) {
            return res.status(200).json({ available: false, reason: "reserved" });
        }
        const taken = await userModel.findOne({ username: name }).select("_id");
        if (!taken) return res.status(200).json({ available: true });

        // free again once the owner has been deleted or is not me
        if (req.user && String(taken._id) === String(req.user._id)) {
            return res.status(200).json({ available: true });
        }
        return res.status(200).json({ available: false, reason: "taken" });
    } catch (err) {
        console.log(`error in checkUsername, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
};

// PUT /api/friend/set-username   body: { username }
// Claim (or change) your @id. Users who never set one land here via the banner.
export const setUsername = async (req, res) => {
    try {
        const name = String(req.body.username || "").trim().toLowerCase();
        if (!USERNAME_RE.test(name)) {
            return res.status(400).json({ message: "invalid-username" });
        }
        if (RESERVED.has(name)) {
            return res.status(400).json({ message: "reserved-username" });
        }

        const taken = await userModel.findOne({ username: name, _id: { $ne: req.user._id } }).select("_id");
        if (taken) return res.status(400).json({ message: "username-taken" });

        const user = await userModel.findByIdAndUpdate(
            req.user._id,
            { username: name },
            { new: true, runValidators: true }
        );
        if (!user) return res.status(404).json({ message: "user not found" });

        // the nudge is no longer relevant
        await notificationModel.deleteOne({ userId: req.user._id, type: "set-username" });

        return res.status(200).json({ username: user.username });
    } catch (err) {
        // duplicate key = two people raced for the same handle
        if (err?.code === 11000) {
            return res.status(400).json({ message: "username-taken" });
        }
        console.log(`error in setUsername, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
};

// GET /api/friend/search/:username
// Find someone by @id. Returns the public card + where the relationship stands,
// so the UI can show "Send request" / "Requested" / "Message" without guessing.
export const searchByUsername = async (req, res) => {
    try {
        const name = String(req.params.username || "").trim().toLowerCase().replace(/^@/, "");
        if (!name) return res.status(400).json({ message: "username is required" });

        const user = await userModel.findOne({ username: name }).select(PUBLIC_USER_FIELDS);
        if (!user) return res.status(404).json({ message: "not-found" });
        if (String(user._id) === String(req.user._id)) {
            return res.status(400).json({ message: "cannot-add-yourself" });
        }

        const outgoing = await friendRequestModel
            .findOne({ senderId: req.user._id, receiverId: user._id })
            .select("status");
        const incoming = await friendRequestModel
            .findOne({ senderId: user._id, receiverId: req.user._id })
            .select("status");

        let state = "none";
        if (outgoing?.status === "accepted" || incoming?.status === "accepted") {
            state = "connected";
        } else if (outgoing?.status === "pending") {
            state = "requested";
        } else if (incoming?.status === "pending") {
            state = "incoming";
        }

        return res.status(200).json({ user, state });
    } catch (err) {
        console.log(`error in searchByUsername, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
};

// POST /api/friend/request/:userId
// Send (or re-send) a connection request. The receiver gets a live in-app
// notification - nothing is exposed to them until they approve it.
export const sendFriendRequest = async (req, res) => {
    try {
        const { userId: receiverId } = req.params;
        const myId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: "invalid receiver id" });
        }
        if (String(receiverId) === String(myId)) {
            return res.status(400).json({ message: "cannot-add-yourself" });
        }

        const receiver = await userModel.findById(receiverId).select("_id username fullName");
        if (!receiver) return res.status(404).json({ message: "user not found" });
        const reverse = await friendRequestModel.findOne({ senderId: receiverId, receiverId: myId });
        if (reverse?.status === "accepted") {
            return res.status(400).json({ message: "already-connected" });
        }
        // they already asked me -> sending back is the same as accepting
        if (reverse?.status === "pending") {
            reverse.status = "accepted";
            await reverse.save();
            await notifyAccepted(myId, receiver._id);
            return res.status(200).json({ message: "accepted", state: "connected" });
        }

        let mine = await friendRequestModel.findOne({ senderId: myId, receiverId });
        if (mine?.status === "accepted") return res.status(400).json({ message: "already-connected" });

        if (mine) {
            mine.status = "pending";
            await mine.save();
        } else {
            mine = await friendRequestModel.create({ senderId: myId, receiverId });
        }

        const me = await userModel.findById(myId).select("fullName username");
        await createNotification({
            userId: receiverId,
            type: "friend-request",
            title: (me?.fullName || "Someone") + " wants to connect",
            body: me?.username ? "@" + me.username : "",
            fromUserId: myId,
            refId: String(mine._id),
        });

        return res.status(201).json({ message: "request sent", state: "requested" });
    } catch (err) {
        if (err?.code === 11000) {
            return res.status(400).json({ message: "already-requested" });
        }
        console.log(`error in sendFriendRequest, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
};

// shared by send/accept: both sides are connected now -> drop the pending nudge
// and tell each of them through their own in-app notification.
const notifyAccepted = async (meId, otherId) => {
    await notificationModel.deleteMany({
        $or: [
            { userId: otherId, type: "friend-request", fromUserId: meId },
            { userId: meId, type: "friend-request", fromUserId: otherId },
        ],
    });

    const me = await userModel.findById(meId).select("fullName");
    const other = await userModel.findById(otherId).select("fullName");

    await createNotification({
        userId: otherId,
        type: "friend-accepted",
        title: "You are now connected with " + (me?.fullName || "someone"),
        fromUserId: meId,
        refId: "accepted:" + String(meId),
    });
    await createNotification({
        userId: meId,
        type: "friend-accepted",
        title: "You are now connected with " + (other?.fullName || "someone"),
        fromUserId: otherId,
        refId: "accepted:" + String(otherId),
    });
};

// POST /api/friend/accept/:requestId
// Approve a connection request. Only from now on can the two of them chat.
export const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await friendRequestModel.findById(requestId);
        if (!request) return res.status(404).json({ message: "request not found" });
        if (!request.receiverId.equals(req.user._id)) {
            return res.status(403).json({ message: "not your request" });
        }
        if (request.status !== "pending") {
            return res.status(400).json({ message: "already-handled" });
        }

        request.status = "accepted";
        await request.save();
        await notifyAccepted(request.receiverId, request.senderId);

        return res.status(200).json({ message: "accepted", state: "connected" });
    } catch (err) {
        console.log(`error in acceptFriendRequest, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
};

// POST /api/friend/reject/:requestId
export const rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await friendRequestModel.findById(requestId);
        if (!request) return res.status(404).json({ message: "request not found" });
        if (!request.receiverId.equals(req.user._id)) {
            return res.status(403).json({ message: "not your request" });
        }
        if (request.status !== "pending") {
            return res.status(400).json({ message: "already-handled" });
        }

        request.status = "rejected";
        await request.save();
        await notificationModel.deleteOne({
            userId: req.user._id,
            type: "friend-request",
            refId: String(request._id),
        });

        return res.status(200).json({ message: "rejected" });
    } catch (err) {
        console.log(`error in rejectFriendRequest, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
};
// GET /api/notifications
// The in-app bell: newest first, unread count, plus a "needs a username" flag
// the client uses to show the mandatory @id banner.
export const getNotifications = async (req, res) => {
    try {
        const myId = req.user._id;

        let notifications = await notificationModel
            .find({ userId: myId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("fromUserId", "fullName username profilePic")
            .lean();

        // old accounts without a handle get a one-time nudge, created lazily
        const me = await userModel.findById(myId).select("username");
        if (me && !me.username) {
            const existing = notifications.find((n) => n.type === "set-username");
            if (!existing) {
                await createNotification({
                    userId: myId,
                    type: "set-username",
                    title: "Choose your @id",
                    body: "Friends find you by your id - set it now so they can add you.",
                    refId: "set-username",
                });
                notifications = await notificationModel
                    .find({ userId: myId })
                    .sort({ createdAt: -1 })
                    .limit(50)
                    .populate("fromUserId", "fullName username profilePic")
                    .lean();
            }
        }

        const unread = notifications.filter((n) => !n.read).length;
        return res.status(200).json({
            notifications,
            unread,
            hasUsername: !!me?.username,
        });
    } catch (err) {
        console.log(`error in getNotifications, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
};

// PUT /api/notifications/read   body: { id? }  - all when id omitted
export const markNotificationsRead = async (req, res) => {
    try {
        const filter = { userId: req.user._id, read: false };
        if (req.body.id) filter._id = req.body.id;
        await notificationModel.updateMany(filter, { $set: { read: true } });
        return res.status(200).json({ message: "ok" });
    } catch (err) {
        console.log(`error in markNotificationsRead, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
};
