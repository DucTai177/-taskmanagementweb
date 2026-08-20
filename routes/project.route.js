import express from "express";
import { createProject } from "../controllers/project.controller.js";

const router = express.Router();

// Định nghĩa phương thức POST để tạo dự án
router.post("/", createProject);

export default router;
