import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from "../controllers/task.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, createTask);
router.get("/", verifyToken, getTasks); //
router.get("/:id", verifyToken, getTaskById);
router.put("/:id", verifyToken, updateTask);
router.patch("/:id/status", verifyToken, updateTaskStatus);

router.delete("/:id", verifyToken, deleteTask);

export default router;
