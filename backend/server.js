import express from "express";
import dotenv from "dotenv";
import connectToDatabase from "./lib/db.js";



dotenv.config();
const app = express();



connectToDatabase()



app.get("/", (req, res) => {
    res.send("hello world");
})




app.listen(5000, () => {
    console.log("server is running on port 5000");

})