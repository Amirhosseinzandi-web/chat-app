import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import connectToDatabase from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import authRoute from "./routes/authRoute.js";
import messageRoute from "./routes/messageRoute.js";
import adminRoute from "./routes/adminRoute.js";
import pushRoute from "./routes/pushRoute.js";
import { setVapidKeys } from "./lib/push.js";
import cors from "cors";






const corsOptions = {
    origin: ["http://localhost:3000", "https://chat-app-frontend-ten-alpha.vercel.app"],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization"]
};


app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

await connectToDatabase();


// *************Auth Routes*************************************

app.use("/api/auth", authRoute)
app.use("/api/message", messageRoute)
app.use("/api/admin", adminRoute)
app.use("/api/push", pushRoute)

// initialize the VAPID keypair (generated once by scripts/generate-vapid-keys.js)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    setVapidKeys(JSON.parse(process.env.VAPID_PRIVATE_KEY));
    console.log("VAPID push keys loaded");
} else {
    console.log("WARNING: VAPID keys missing - run scripts/generate-vapid-keys.js (push disabled)");
}

server.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
})