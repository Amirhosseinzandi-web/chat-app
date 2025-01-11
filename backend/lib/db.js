import mongoose from "mongoose";




const connectToDatabase = () => {
    try {
        mongoose.connect(process.env.CHAT_APP_API_URL)
        console.log("connected to database");
    }
    catch (err) {
        console.log("error connecting to database");
        throw err
    }
}


export default connectToDatabase