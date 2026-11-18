import mongoose from "mongoose";
import friendRequestModel from "../models/friendRequestModel.js";
import messageModel from "../models/messageModel.js";

/**
 * Are these two users allowed to chat with each other?
 *
 * Allowed when ANY of the following holds:
 *  - it is Saved Messages (you talking to yourself),
 *  - they have an ACCEPTED friend request,
 *  - they already exchanged at least one message before this feature shipped
 *    (so existing conversations never break).
 *
 * A pending or rejected request - and any stranger who found you - is NOT allowed.
 */
export const areConnected = async (a, b) => {
    const aId = new mongoose.Types.ObjectId(String(a));
    const bId = new mongoose.Types.ObjectId(String(b));

    if (String(aId) === String(bId)) return true; // Saved Messages

    const accepted = await friendRequestModel.findOne({
        status: "accepted",
        $or: [
            { senderId: aId, receiverId: bId },
            { senderId: bId, receiverId: aId },
        ],
    }).select("_id");

    if (accepted) return true;

    // legacy escape hatch: a conversation existed before the request system
    const legacy = await messageModel.findOne({
        $or: [
            { senderId: aId, receiverId: bId },
            { senderId: bId, receiverId: aId },
        ],
    }).select("_id");

    return !!legacy;
};

/** Ids of everyone this user may see in the chat list. */
export const getConnectedUserIds = async (myId) => {
    const me = new mongoose.Types.ObjectId(String(myId));
    const ids = new Set();

    const accepted = await friendRequestModel
        .find({
            status: "accepted",
            $or: [{ senderId: me }, { receiverId: me }],
        })
        .select("senderId receiverId");

    for (const r of accepted) {
        ids.add(String(r.senderId.equals(me) ? r.receiverId : r.senderId));
    }

    // legacy: anyone I already talked to keeps their seat in the list
    const peers = await messageModel.aggregate([
        { $match: { $or: [{ senderId: me }, { receiverId: me }] } },
        {
            $project: {
                other: {
                    $cond: [{ $eq: ["$senderId", me] }, "$receiverId", "$senderId"],
                },
            },
        },
        { $group: { _id: "$other" } },
    ]);

    for (const peer of peers) {
        if (peer._id && String(peer._id) !== String(me)) ids.add(String(peer._id));
    }

    return [...ids];
};
