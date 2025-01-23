import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import connectToDatabase from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import authRoute from "./routes/authRoute.js";
import messageRoute from "./routes/messageRoute.js";
import cors from "cors";



dotenv.config();


const corsOptions = {
    origin: ["http://localhost:3000", "https://chat-app-frontend-ten-alpha.vercel.app"],
    credentials: true,
    optionsSuccessStatus: 200
};


app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

connectToDatabase();


// *************Auth Routes*************************************

app.use("/api/auth", authRoute)
app.use("/api/message", messageRoute)




server.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
})