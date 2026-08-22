import express from "express";
import dotenv from "dotenv";
import projectRoutes from "./routes/project.route.js";
import authRoutes from "./routes/auth.route.js";
import taskRoutes from "./routes/task.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Đọc dữ liệu JSON gửi lên từ body
app.use(express.json());

// Gắn route
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/tasks", taskRoutes);

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
