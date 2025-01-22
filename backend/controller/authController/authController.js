import _ from "lodash";
import userModel from "../../models/userModel.js";
import bcrypt from "bcrypt"

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
            await user.generateAuthToken(res);

            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                profilePic: user.profilePic
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
        await currentUser.generateAuthToken(res);
        res.status(200).json({
            _id: currentUser._id,
            fullName: currentUser.fullName,
            email: currentUser.email,
            profilePic: currentUser.profilePic
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

        res.clearCookie('jwt', {
            httpOnly: true,
            sameSite: 'None',
            secure: process.env.NODE_ENV === 'production'
        });

        res.status(200).json({ message: "logout success" });
    } catch (err) {
        console.log(`error in logout controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}


export const updateProfile = async (req, res) => {
    try {

        const profilePicAddres = req.body.profilePic;
        const userId = req.user._id;

        if (!profilePicAddres) {
            return res.status(400).json({ message: "profile pic is required" });
        }

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        const updatedUser = await userModel.findByIdAndUpdate(userId, { profilePic: profilePicAddres }, { new: true });
        res.status(200).json(updatedUser);

    } catch (err) {
        console.log(`error in updateProfile controller, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}



export const getAllUsers = async (req, res) => {
    try {
        const allUsers = await userModel.find({})
        res.json(allUsers)
    } catch (err) {
        console.log("error in get all users, error is ==>", err);
        return res.status(404)
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