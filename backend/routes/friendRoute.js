import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
    checkUsername,
    setUsername,
    searchByUsername,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getNotifications,
    markNotificationsRead,
} from "../controller/friendController/friendController.js";

const router = express.Router();

// public: the signup form asks while the user is not logged in yet.
// It only answers "free / taken / invalid" - no user data is returned.
router.get("/check-username/:name", checkUsername);

// everything below needs a session
router.use(protectRoute);

router.put("/set-username", setUsername);
router.get("/search/:username", searchByUsername);

router.post("/request/:userId", sendFriendRequest);
router.post("/accept/:requestId", acceptFriendRequest);
router.post("/reject/:requestId", rejectFriendRequest);

router.get("/notifications", getNotifications);
router.put("/notifications/read", markNotificationsRead);

export default router;
