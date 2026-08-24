import prisma from "../db.js";

// 1. Thống kê theo Dự án (F05)
export const getProjectStatistics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUserId = req.user.id;

    // Kiểm tra dự án tồn tại
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: {
        members: true,
        tasks: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dự án.",
        data: null,
      });
    }

    // Kiểm tra quyền thành viên
    const isMember = project.members.some((m) => m.userId === currentUserId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem thống kê của dự án này.",
        data: null,
      });
    }

    const now = new Date();
    const totalTasks = project.tasks.length;

    // Khởi tạo bộ đếm trạng thái
    const statusCounts = {
      TODO: 0,
      DOING: 0,
      DONE: 0,
    };

    let overdueTasks = 0;

    project.tasks.forEach((task) => {
      // Đếm theo trạng thái
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }

      // Đếm công việc quá hạn (chưa DONE và dueDate < hiện tại)
      if (
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== "DONE"
      ) {
        overdueTasks++;
      }
    });

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê dự án thành công.",
      data: {
        projectId: project.id,
        projectName: project.name,
        totalTasks,
        statusCounts,
        overdueTasks,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê dự án.",
      data: error.message,
    });
  }
};

// 2. Thống kê cá nhân của người dùng đang đăng nhập (F05)
export const getPersonalStatistics = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Đếm tổng số task được giao
    const totalAssignedTasks = await prisma.task.count({
      where: { assigneeId: currentUserId },
    });

    // Đếm số task đã hoàn thành
    const totalDoneTasks = await prisma.task.count({
      where: {
        assigneeId: currentUserId,
        status: "DONE",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê cá nhân thành công.",
      data: {
        userId: currentUserId,
        totalAssignedTasks,
        totalDoneTasks,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê cá nhân.",
      data: error.message,
    });
  }
};
