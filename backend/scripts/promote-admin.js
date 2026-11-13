// One-time script: give the admin role to an account by email.
// Usage:  node scripts/promote-admin.js you@example.com
// Run from the backend folder while .env exists (dotenv/config reads it).
import "dotenv/config";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";

const email = process.argv[2];

if (!email) {
    console.error("usage: node scripts/promote-admin.js <email>");
    process.exit(1);
}

await mongoose.connect(process.env.CHAT_APP_API_URL);

const user = await userModel.findOneAndUpdate(
    { email },
    { role: "admin" },
    { new: true, select: "email role" }
);

if (!user) {
    console.error(`no account found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
}

console.log(`done. ${user.email} is now: ${user.role}`);
await mongoose.disconnect();
