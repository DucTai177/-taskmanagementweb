import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} from "../controllers/project.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/", verifyToken, createProject);
router.get("/", verifyToken, getProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/members", verifyToken, addMember);
router.delete("/:id/members/:userId", verifyToken, removeMember);

export default router;
