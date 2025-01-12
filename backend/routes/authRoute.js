import express from 'express';
import { login, signUp, logout, updateProfile, getAllUsers , checkAuth } from "../controller/authController/authController.js"
import { protectRoute } from '../middlewares/protectRoute.js';


const router = express.Router();


router.get("/get-users", getAllUsers)
router.post("/signup", signUp)
router.post("/login", login)
router.delete("/logout", logout)

router.put("/update-profile", protectRoute, updateProfile)

router.get("/check" , protectRoute , checkAuth)

export default router