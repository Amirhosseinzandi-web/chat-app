import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import { getUsersForSidebar, getMessages, sendMessage, deleteMessage, clearConversation, editMessage } from "../controller/messageController/messageController.js";


const router = express.Router();


router.get("/users", protectRoute, getUsersForSidebar)
router.get("/:id", protectRoute, getMessages)

router.post("/send/:id", protectRoute, sendMessage)
router.put("/:id", protectRoute, editMessage)

// IMPORTANT: "/clear/:id" must come before "/:id" or it would be swallowed by it
router.delete("/clear/:id", protectRoute, clearConversation)
router.delete("/:id", protectRoute, deleteMessage)










export default router