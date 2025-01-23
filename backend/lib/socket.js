import { Server } from "socket.io";
import http from "http";
import express from "express";



const app = express()
const server = http.createServer(app);




const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://localhost:3000", 
            "https://chat-app-frontend-ten-alpha.vercel.app"
        ],
        credentials: true,
        optionsSuccessStatus: 200
    }
});


io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    socket.on("disconnect", () => {
        // console.log("user disconnected", socket.id);
    })

})




export { io, app, server }