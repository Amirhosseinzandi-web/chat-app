import userModel from "../models/userModel.js";



// must run AFTER protectRoute (needs req.user). Only accounts with role "admin" pass.
export const adminOnly = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "not authorized" });
        }

        // re-read role from DB so a stale token cannot carry an old role
        const user = await userModel.findById(req.user._id).select("role");
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "admin access required" });
        }

        next();
    } catch (err) {
        console.log(`error in adminOnly middleware, error is ==> ${err}`);
        return res.status(500).json({ message: "server-error" });
    }
}
