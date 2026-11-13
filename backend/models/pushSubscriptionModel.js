import mongoose from "mongoose";


const pushSubscriptionSchema = new mongoose.Schema(
    {
        // one user can have many subscriptions (iPhone + Android + desktop)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userModel",
            required: true,
            index: true
        },
        endpoint: {
            type: String,
            required: true,
            unique: true
        },
        // { p256dh, auth } base64url strings
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true }
        }
    },
    { timestamps: true }
);


const pushSubscriptionModel = mongoose.model("pushSubscription", pushSubscriptionSchema, "pushSubscriptions");

export default pushSubscriptionModel;
