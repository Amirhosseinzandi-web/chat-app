import express from 'express';
import { login, signUp, logout, updateProfile } from "../controller/authController/authController.js"
import { protectRoute } from '../middlewares/protectRoute.js';


const router = express.Router();



router.post("/signup", signUp)
router.post("/login", login)
router.post("/logout", logout)

router.put("/update-profile", protectRoute, updateProfile)

export default router