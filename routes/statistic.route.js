import express from "express";
import {
  getProjectStatistics,
  getPersonalStatistics,
} from "../controllers/statistic.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Thống kê cá nhân
router.get("/personal", verifyToken, getPersonalStatistics);

// Thống kê theo từng dự án
router.get("/projects/:projectId", verifyToken, getProjectStatistics);

export default router;
