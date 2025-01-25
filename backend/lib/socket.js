import { Server } from "socket.io";
import http from "http";
import express from "express";



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




io.on("connection", (socket) => {
    // console.log("a user connected", socket.id);

    const { userId } = socket.handshake.query;
    if (userId) userSocketMap[userId] = socket.id
    // console.log("socket id ==>",socket.id);
    

    io.emit("getOnlineUsers", Object.keys(userSocketMap))
    // console.log(userSocketMap);


    socket.on("disconnect", () => {
        // console.log("user disconnected");
        delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })

})




export { io, app, server }