import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import _ from "lodash"
import bcrypt from "bcrypt"



const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        fullName: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true,
            minLength: 6
        },
        profilePic: {
            type: String,
            default: ""
        },
        tokens: [
            { tokenKey: String, time: { type: Date, default: Date.now() } }
        ]
    },
    { timestamps: true }
);



userSchema.pre("save", async function (next) {
    if (this.isNew || this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
})


userSchema.methods.generateAuthToken = async function (res) {
    try {
        const payload = { id: this._id };
        const token = jwt.sign(payload, `${process.env.JWT_SECURITY_KEY}`, { expiresIn: "7d" })
        this.tokens.push({ tokenKey: token })
        await this.save()
        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true, // cookie is only accessible from the server not js
            sameSite: "Lax",
            secure: process.env.NODE_ENV === 'production'
        })
        return token
    }
    catch (err) {
        console.log(`error in generateAuthToken model, error is ==> ${err}`);
    }
}


const userModel = mongoose.model("userModel", userSchema, "users");


export default userModel