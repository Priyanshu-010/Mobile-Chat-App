import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  uploadStatus,
  getMyStatus,
  getAllStatuses,
  viewStatus,
  deleteStatus,
} from "../controllers/StatusController.js";

const router = express.Router();

router.post("/", protect, uploadStatus);
router.get("/me", protect, getMyStatus);
router.get("/", protect, getAllStatuses);
router.put("/view/:statusId", protect, viewStatus);
router.delete("/:statusId", protect, deleteStatus);

export default router;