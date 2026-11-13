import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
    getVapidPublicKey,
    subscribeToPush,
    unsubscribeFromPush,
    setNotificationsEnabled,
    setChatMuted,
    sendTestPush,
} from "../controller/pushController/pushController.js";


const router = express.Router();

// public key does not need auth (the page asks for it before subscribing)
router.get("/public-key", getVapidPublicKey)

router.use(protectRoute);
router.post("/subscribe", subscribeToPush)
router.delete("/unsubscribe", unsubscribeFromPush)
router.put("/notifications", setNotificationsEnabled)
router.put("/mute/:chatId", setChatMuted)
router.post("/test", sendTestPush)

export default router
