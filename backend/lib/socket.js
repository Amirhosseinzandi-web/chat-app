import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";



const app = express()
const server = http.createServer(app);




const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://chat-app-frontend-ten-alpha.vercel.app"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    },
    transports: ['websocket', 'polling']
});




export const getReciverSocketId = (userId) => {
    return userSocketMap[userId]
}

export const getUserSocketMap = () => userSocketMap



// used to store online users
const userSocketMap = {}




// authenticate the socket handshake with a JWT (auth.token) and derive userId from it.
// fallback: legacy clients may still pass userId in the handshake query.
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECURITY_KEY);
            socket.data.userId = decoded.id;
            return next();
        }

        // legacy fallback (deprecated): query-based identity. Remove once all clients send tokens.
        const { userId } = socket.handshake.query;
        if (userId) {
            socket.data.userId = userId;
            return next();
        }

        return next(new Error("authentication required"));
    } catch (err) {
        return next(new Error("authentication failed"));
    }
});



io.on("connection", (socket) => {
    const userId = socket.data.userId;
    if (userId) userSocketMap[userId] = socket.id

    io.emit("getOnlineUsers", Object.keys(userSocketMap))


    socket.on("disconnect", () => {
        // only remove the mapping if it still points to this socket (handles multi-tab/multi-device)
        if (userSocketMap[userId] === socket.id) {
            delete userSocketMap[userId]
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })

})




export { io, app, server }
