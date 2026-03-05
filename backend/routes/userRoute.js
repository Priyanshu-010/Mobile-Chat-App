import express from "express"
import { getProfile, getUsers, updateProfile } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/me", protect, getProfile);
router.put("/update", protect, updateProfile);

export default router