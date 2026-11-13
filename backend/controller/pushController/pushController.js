import pushSubscriptionModel from "../../models/pushSubscriptionModel.js";
import userModel from "../../models/userModel.js";
import { vapidPublicKeyBase64Url, pushToSubscription } from "../../lib/push.js";


// GET /api/push/public-key  -> { publicKey } (the browser needs it to subscribe)
export const getVapidPublicKey = async (req, res) => {
    try {
        res.status(200).json({ publicKey: vapidPublicKeyBase64Url() });
    } catch (err) {
        console.log("error in getVapidPublicKey, error is ==> ", err);
        res.status(500).json({ message: "push not configured" });
    }
};


// POST /api/push/subscribe  body: { endpoint, keys: { p256dh, auth } }
// one user can have many devices (iPhone + Android + desktop)
export const subscribeToPush = async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        const userId = req.user._id;
        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return res.status(400).json({ message: "invalid subscription" });
        }
        // upsert: same endpoint from the same user just refreshes the keys
        await pushSubscriptionModel.findOneAndUpdate(
            { endpoint },
            { $set: { user: userId, keys } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ message: "subscribed" });
    } catch (err) {
        console.log("error in subscribeToPush, error is ==> ", err);
        res.status(500).json({ message: "server-error" });
    }
};


// DELETE /api/push/unsubscribe  body: { endpoint }
export const unsubscribeFromPush = async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) return res.status(400).json({ message: "endpoint required" });
        await pushSubscriptionModel.deleteOne({ endpoint, user: req.user._id });
        res.status(200).json({ message: "unsubscribed" });
    } catch (err) {
        console.log("error in unsubscribeFromPush, error is ==> ", err);
        res.status(500).json({ message: "server-error" });
    }
};


// PUT /api/push/notifications  body: { enabled: boolean }  (app-level mute, Telegram-style)
export const setNotificationsEnabled = async (req, res) => {
    try {
        const { enabled } = req.body;
        if (typeof enabled !== "boolean") {
            return res.status(400).json({ message: "enabled must be a boolean" });
        }
        const user = await userModel.findByIdAndUpdate(
            req.user._id,
            { notificationsEnabled: enabled },
            { new: true, select: "notificationsEnabled mutedChats" }
        );
        res.status(200).json(user);
    } catch (err) {
        console.log("error in setNotificationsEnabled, error is ==> ", err);
        res.status(500).json({ message: "server-error" });
    }
};


// PUT /api/push/mute/:chatId  body: { muted: boolean }  (per-chat mute)
export const setChatMuted = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { muted } = req.body;
        if (typeof muted !== "boolean") {
            return res.status(400).json({ message: "muted must be a boolean" });
        }
        const field = "mutedChats." + chatId;
        const operator = muted ? { $set: { [field]: true } } : { $unset: { [field]: "" } };
        const user = await userModel.findByIdAndUpdate(req.user._id, operator, { new: true, select: "mutedChats" });
        res.status(200).json({ mutedChats: Object.fromEntries(user.mutedChats || {}) });
    } catch (err) {
        console.log("error in setChatMuted, error is ==> ", err);
        res.status(500).json({ message: "server-error" });
    }
};


// POST /api/push/test  -> send a test push to ALL my devices (verifies the whole chain)
export const sendTestPush = async (req, res) => {
    try {
        const subs = await pushSubscriptionModel.find({ user: req.user._id });
        if (subs.length === 0) {
            return res.status(400).json({ message: "no push subscription on this account yet" });
        }
        let ok = 0;
        const failed = [];
        for (const sub of subs) {
            try {
                await pushToSubscription(sub, {
                    title: "Chatty",
                    body: "This is a test notification 🎉",
                    conversationId: String(req.user._id),
                });
                ok++;
            } catch (e) {
                failed.push(e.message);
            }
        }
        res.status(200).json({ sent: ok, failed });
    } catch (err) {
        console.log("error in sendTestPush, error is ==> ", err);
        res.status(500).json({ message: "server-error" });
    }
};


// fire-and-forget: push a new message to a user who has no live socket.
// Honors: app-level mute + per-chat mute. Saves failed subscriptions (404/410).
export const pushMessageIfOffline = async (receiverUser, message) => {
    try {
        if (!receiverUser) return;

        // Saved Messages (sent to self): still push — other devices should see it too
        const isSaved = String(message.senderId) === String(message.receiverId);

        // app-level mute
        if (!isSaved && receiverUser.notificationsEnabled === false) return;
        // per-chat mute
        if (!isSaved && receiverUser.mutedChats?.[String(message.senderId)]) return;

        const sender = await userModel.findById(message.senderId).select("fullName profilePic");

        const payload = {
            title: isSaved ? "Chatty" : sender?.fullName || "New message",
            body: message.text || (message.image ? "📷 Photo" : ""),
            conversationId: isSaved ? String(message.receiverId) : String(message.senderId),
        };

        const subs = await pushSubscriptionModel.find({ user: receiverUser._id });
        await Promise.all(subs.map(async (sub) => {
            try {
                const alive = await pushToSubscription(sub, payload);
                if (!alive) {
                    // the push service told us the subscription is gone
                    await pushSubscriptionModel.deleteOne({ _id: sub._id });
                }
            } catch (e) {
                console.log("push to subscription failed:", e.message);
            }
        }));
    } catch (err) {
        console.log("error in pushMessageIfOffline, error is ==> ", err);
    }
};
