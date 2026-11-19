import _ from "lodash";
import userModel from "../../models/userModel.js";
import bcrypt from "bcrypt"
import { io, getReciverSocketId } from "../../lib/socket.js"

export const signUp = async (req, res) => {
    try {
        const userData = _.pick(req.body, ["fullName", "email", "password"]);
        if (!userData.email || !userData.password || !userData.fullName) {
            return res.status(400).json({ message: "all fields are required" });
        }
        if (userData.password.length < 6) {
            return res.status(400).json({ message: "weak password" });
        }
        const isUserExist = await userModel.findOne({ email: userData.email });
        if (isUserExist) {
            return res.status(400).json({ message: "user already exist" });
        }
        const user = await userModel.create(userData);
        if (user) {
            // generate auth token
            const token = await user.generateAuthToken(res);

            res.status(201).json({
                token,
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                username: user.username ?? null,
                profilePic: user.profilePic,
                role: user.role,
            });

        } else {
            return res.status(400).json({ message: "invalid user data" });
        }

    } catch (error) {
        console.log(`error in signUp controller, error is ==> ${error}`);
        return res.status(500).json({ message: "server-error" });
    }
}


export const login = async (req, res) => {
    try {
        const userData = _.pick(req.body, ["email", "password"]);
        const currentUser = await userModel.findOne({ email: userData.email });

        if (!currentUser) {
            return res.status(400).json({ message: "User not found." });
        }

        const isPasswordMatch = await bcrypt.compare(userData.password, currentUser.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }
        const token = await currentUser.generateAuthToken(res);
        res.status(200).json({
            token,
            _id: currentUser._id,
            fullName: currentUser.fullName,
            email: currentUser.email,
            username: currentUser.username ?? null,
            profilePic: currentUser.profilePic,
            role: currentUser.role,
        });
    }
    catch (err) {
        console.log(`error in login controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}


export const logout = async (req, res) => {
    try {
        // res.cookie("jwt", "", { maxAge: 0 });
        const currentToken = req.token
        await userModel.findOneAndUpdate({ _id: req.user._id }, { $pull: { tokens: { tokenKey: currentToken } } });

        res.clearCookie("jwt", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        });

        res.status(200).json({ message: "logout success" });
    } catch (err) {
        console.log(`error in logout controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}


export const updateProfile = async (req, res) => {
    try {

        const { profilePic, fullName, email } = req.body;
        const userId = req.user._id;

        // at least one editable field must be present
        if (!profilePic && fullName === undefined && email === undefined) {
            return res.status(400).json({ message: "nothing to update" });
        }

        // build only the fields that are being changed
        const update = {};
        if (profilePic) update.profilePic = profilePic;

        if (fullName !== undefined) {
            const name = String(fullName).trim();
            if (name.length < 2 || name.length > 40) {
                return res.status(400).json({ message: "invalid-fullname" });
            }
            update.fullName = name;
        }

        if (email !== undefined) {
            const mail = String(email).trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
                return res.status(400).json({ message: "invalid-email" });
            }
            // email must stay unique across accounts (case-insensitive)
            const taken = await userModel.findOne({ email: mail, _id: { $ne: userId } }).select("_id");
            if (taken) return res.status(400).json({ message: "email-taken" });
            update.email = mail;
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            update,
            { new: true, select: "_id fullName email username profilePic createdAt" }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: "user not found" });
        }
        res.status(200).json(updatedUser);

        // live refresh for connected clients only (never broadcast to strangers).
        // best-effort: the response is already sent, so NEVER let a socket or
        // network hiccup here re-enter the catch block (it would crash the
        // process with ERR_HTTP_HEADERS_SENT).
        try {
            const { getConnectedUserIds } = await import("../../lib/connections.js");
            const contactIds = await getConnectedUserIds(updatedUser._id);
            for (const contactId of contactIds) {
                const socketId = getReciverSocketId(contactId);
                if (socketId) {
                    io.to(socketId).emit("userUpdated", {
                        _id: updatedUser._id,
                        fullName: updatedUser.fullName,
                        email: updatedUser.email,
                        username: updatedUser.username,
                        profilePic: updatedUser.profilePic,
                    });
                }
            }
        } catch (liveErr) {
            console.log("userUpdated fan-out skipped:", liveErr?.message || liveErr);
        }

    } catch (err) {
        if (err?.code === 11000) {
            return res.status(400).json({ message: "email-taken" });
        }
        console.log(`error in updateProfile controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}



export const getAllUsers = async (req, res) => {
    try {
        const allUsers = await userModel.find({}).select("_id fullName email profilePic createdAt")
        res.json(allUsers)
    } catch (err) {
        console.log("error in get all users, error is ==>", err);
        return res.status(500).json({ message: "server-error" })
    }
}


export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (err) {
        console.log(`error in checkAuth controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}
