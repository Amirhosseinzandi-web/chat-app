import mongoose from "mongoose";



const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.CHAT_APP_API_URL, {
            // wait longer than the default 30s? No - the default is fine; but if Atlas/DNS is
            // temporarily unreachable we want a clear error instead of a crash.
            serverSelectionTimeoutMS: 30000,
        });
        console.log("connected to database");
        return true;
    } catch (err) {
        console.error("error connecting to database:", err.message);
        process.exit(1);
    }
}



export default connectToDatabase
