import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import { adminOnly } from "../middlewares/adminOnly.js";
import { getStats, listUsers, deleteUser, deleteConversation, resetDatabase } from "../controller/adminController/adminController.js";


const router = express.Router();

// every admin route requires an authenticated admin
router.use(protectRoute, adminOnly);

router.get("/stats", getStats);
router.get("/users", listUsers);
router.delete("/user/:id", deleteUser);
router.delete("/messages/:userA/:userB", deleteConversation);
router.post("/reset", resetDatabase);

export default router;
