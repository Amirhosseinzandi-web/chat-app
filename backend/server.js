import express from "express";
import dotenv from "dotenv";
import connectToDatabase from "./lib/db.js";
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js"
import messageRoute from "./routes/messageRoute.js"
import { app, server } from "./lib/socket.js"


dotenv.config();


app.use(express.json());
app.use(cookieParser());

connectToDatabase();


// *************Auth Routes*************************************

app.use("/api/auth", authRoute)
app.use("/api/message", messageRoute)




server.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
})