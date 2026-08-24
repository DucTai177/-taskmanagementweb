import prisma from "../db.js";
//tạo dự án
export const createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate } = req.body;
    const currentUserId = req.user.id; // Lấy tự động từ middleware!

    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        ownerId: currentUserId,
        members: {
          create: {
            userId: currentUserId,
            role: "OWNER",
          },
        },
      },
      include: {
        members: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Tạo dự án thành công.",
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo dự án.",
      data: error.message,
    });
  }
};

//lấy danh sách dự án

export const getProjects = async (req, res) => {
  try {
    const currentUserId = req.user.id; // Lấy ID của user từ token

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: currentUserId }, // 1. User là Chủ sở hữu
          {
            members: {
              some: {
                userId: currentUserId, // 2. Hoặc User nằm trong danh sách thành viên
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách dự án thành công.",
      data: projects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách dự án.",
      data: error.message,
    });
  }
};
// lấy dự án theo id

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        tasks: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dự án với ID này.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết dự án thành công.",
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết dự án.",
      data: error.message,
    });
  }
};

//sửa dự án
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate } = req.body;

    // Kiểm tra dự án có không
    const existingProject = await prisma.project.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dự án để cập nhật.",
        data: null,
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật dự án thành công.",
      data: updatedProject,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật dự án.",
      data: error.message,
    });
  }
};

// 2. Xóa dự án
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra dự án có tồn tại trước khi xóa
    const existingProject = await prisma.project.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dự án để xóa.",
        data: null,
      });
    }

    await prisma.project.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa dự án thành công.",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa dự án.",
      data: error.message,
    });
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////
//thêm thành viên
// 1. Thêm thành viên vào dự án (F02)
export const addMember = async (req, res) => {
  try {
    const { id } = req.params; // ID của Project
    const { userId, role } = req.body; // ID và role của người muốn thêm
    const currentUserId = req.user.id; // Lấy từ auth middleware

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp userId cần thêm.",
        data: null,
      });
    }

    // 1. Kiểm tra dự án có tồn tại không
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dự án.",
        data: null,
      });
    }

    // 2. Phân quyền: Chỉ chủ sở hữu dự án mới có quyền thêm thành viên
    if (project.ownerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thêm thành viên vào dự án này.",
        data: null,
      });
    }

    // 3. Kiểm tra user muốn thêm có tồn tại trong hệ thống không
    const userExists = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "Người dùng cần thêm không tồn tại.",
        data: null,
      });
    }

    // 4. Kiểm tra user này đã là thành viên trong dự án chưa
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: Number(id),
        userId: Number(userId),
      },
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "Người dùng này đã là thành viên của dự án.",
        data: null,
      });
    }

    // 5. Thêm thành viên vào bảng ProjectMember
    const newMember = await prisma.projectMember.create({
      data: {
        projectId: Number(id),
        userId: Number(userId),
        role: role === "OWNER" ? "OWNER" : "MEMBER",
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Thêm thành viên vào dự án thành công.",
      data: newMember,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm thành viên.",
      data: error.message,
    });
  }
};

// 2. Gỡ thành viên khỏi dự án (F02)
export const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const currentUserId = req.user.id;

    // 1. Kiểm tra dự án tồn tại
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dự án.",
        data: null,
      });
    }

    // 2. Phân quyền: Chỉ chủ dự án mới được gỡ thành viên
    if (project.ownerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền gỡ thành viên khỏi dự án này.",
        data: null,
      });
    }

    // 3. Không cho phép tự gỡ chính mình (chủ dự án)
    if (Number(userId) === project.ownerId) {
      return res.status(400).json({
        success: false,
        message: "Không thể gỡ chủ dự án khỏi danh sách thành viên.",
        data: null,
      });
    }

    // 4. Xóa bản ghi trong ProjectMember
    const deleteResult = await prisma.projectMember.deleteMany({
      where: {
        projectId: Number(id),
        userId: Number(userId),
      },
    });

    if (deleteResult.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Thành viên này không nằm trong dự án.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Gỡ thành viên khỏi dự án thành công.",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi gỡ thành viên.",
      data: error.message,
    });
  }
};

///////////////////////////////////////////////////////////////
// F05: Dashboard & Thống kê Dự án
export const getProjectDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // 1. Kiểm tra dự án tồn tại
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dự án.",
        data: null,
      });
    }

    // 2. Phân quyền: Phải là thành viên dự án mới được xem Dashboard
    const isMember = project.members.some((m) => m.userId === currentUserId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem thống kê của dự án này.",
        data: null,
      });
    }

    // 3. Tính toán số liệu thống kê
    const totalTasks = project.tasks.length;

    // Đếm theo trạng thái
    const statusCounts = {
      TODO: 0,
      DOING: 0,
      DONE: 0,
    };

    // Đếm theo mức độ ưu tiên
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    project.tasks.forEach((task) => {
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }
      if (priorityCounts[task.priority] !== undefined) {
        priorityCounts[task.priority]++;
      }
    });

    // Tỷ lệ hoàn thành (%)
    const completionRate =
      totalTasks > 0
        ? Number(((statusCounts.DONE / totalTasks) * 100).toFixed(2))
        : 0;

    // Thống kê phân bổ công việc theo từng thành viên
    const memberWorkload = project.members.map((member) => {
      const assignedTasks = project.tasks.filter(
        (t) => t.assigneeId === member.userId,
      );
      const doneTasks = assignedTasks.filter((t) => t.status === "DONE");

      return {
        userId: member.userId,
        fullName: member.user.fullName,
        email: member.user.email,
        role: member.role,
        totalAssigned: assignedTasks.length,
        totalDone: doneTasks.length,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu Dashboard thành công.",
      data: {
        projectId: project.id,
        projectName: project.name,
        totalMembers: project.members.length,
        totalTasks,
        completionRate: `${completionRate}%`,
        statusCounts,
        priorityCounts,
        memberWorkload,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê Dashboard.",
      data: error.message,
    });
  }
};
