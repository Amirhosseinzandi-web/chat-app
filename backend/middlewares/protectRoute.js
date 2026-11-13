import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";




// token sources, in priority order:
// 1. Authorization: Bearer <token>   (works in every browser, including iOS Safari)
// 2. httpOnly jwt cookie             (fallback; iOS Safari blocks cross-site cookies)
export const protectRoute = async (req, res, next) => {
    try {

        const header = req.headers.authorization;
        const token = (header && header.startsWith("Bearer "))
            ? header.slice(7)
            : req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ message: "not authorized - no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECURITY_KEY)

        if (!decoded) {
            return res.status(401).json({ message: "not authorized - token is invalid" });
        }

        const user = await userModel.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }

        req.user = user;
        req.token = token;
        next();

    } catch (err) {
        console.log(`error in protectRoute middleware, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}
