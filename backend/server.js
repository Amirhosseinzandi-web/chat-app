import express from "express";
import dotenv from "dotenv";
import connectToDatabase from "./lib/db.js";
import authRoute from "./routes/authRoute.js"
import cors from "cors";
import cookieParser from "cookie-parser";


const corsOptions = {
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200
};



dotenv.config();
const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());


connectToDatabase()


// *************Auth Routes*************************************

app.use("/api/auth", authRoute)




app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
})