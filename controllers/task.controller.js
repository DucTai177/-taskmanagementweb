import prisma from "../db.js";

// 1. Tạo công việc (F03)
export const createTask = async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId,
    } = req.body;
    const currentUserId = req.user.id;

    if (!projectId || !title) {
      return res.status(400).json({
        success: false,
        message: "projectId và title là bắt buộc.",
        data: null,
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Dự án không tồn tại.",
        data: null,
      });
    }

    const isMember = await prisma.projectMember.findFirst({
      where: {
        projectId: Number(projectId),
        userId: currentUserId,
      },
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Bạn không phải là thành viên của dự án này để tạo task.",
        data: null,
      });
    }

    if (assigneeId) {
      const isAssigneeInProject = await prisma.projectMember.findFirst({
        where: {
          projectId: Number(projectId),
          userId: Number(assigneeId),
        },
      });

      if (!isAssigneeInProject) {
        return res.status(400).json({
          success: false,
          message:
            "Người được giao task (assignee) chưa tham gia vào dự án này.",
          data: null,
        });
      }
    }

    const newTask = await prisma.task.create({
      data: {
        projectId: Number(projectId),
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: currentUserId,
        assigneeId: assigneeId ? Number(assigneeId) : null,
      },
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true },
        },
        creator: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Tạo công việc thành công.",
      data: newTask,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo công việc.",
      data: error.message,
    });
  }
};

// 2. Lấy danh sách Task và Phân trang (F04 - page, limit)
export const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(limit) || 10);
    const skip = (pageNumber - 1) * pageSize;

    const [totalRecords, tasks] = await Promise.all([
      prisma.task.count(),
      prisma.task.findMany({
        skip,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
          assignee: {
            select: { id: true, fullName: true, email: true },
          },
          creator: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / pageSize);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách công việc thành công.",
      data: {
        tasks,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          totalRecords,
          totalPages,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách công việc.",
      data: error.message,
    });
  }
};

// 3. Xem chi tiết 1 Task (F03)
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: {
        project: {
          select: { id: true, name: true, ownerId: true },
        },
        assignee: {
          select: { id: true, fullName: true, email: true },
        },
        creator: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc với ID này.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin chi tiết công việc thành công.",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết công việc.",
      data: error.message,
    });
  }
};

// 4. Cập nhật Task (F03)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } =
      req.body;
    const currentUserId = req.user.id;

    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc để cập nhật.",
        data: null,
      });
    }

    const isMember = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: currentUserId,
      },
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa công việc trong dự án này.",
        data: null,
      });
    }

    if (assigneeId) {
      const isAssigneeInProject = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: Number(assigneeId),
        },
      });

      if (!isAssigneeInProject) {
        return res.status(400).json({
          success: false,
          message: "Người được giao task mới không thuộc dự án này.",
          data: null,
        });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        status: status || undefined,
        priority: priority || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assigneeId:
          assigneeId !== undefined
            ? assigneeId
              ? Number(assigneeId)
              : null
            : undefined,
      },
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true },
        },
        creator: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật công việc thành công.",
      data: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật công việc.",
      data: error.message,
    });
  }
};

// 5. Cập nhật nhanh trạng thái (F03)
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentUserId = req.user.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái status là bắt buộc.",
        data: null,
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc.",
        data: null,
      });
    }

    const isMember = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: currentUserId,
      },
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật trạng thái công việc này.",
        data: null,
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật nhanh trạng thái công việc thành công.",
      data: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái.",
      data: error.message,
    });
  }
};

// 6. Xóa Task (F03)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc để xóa.",
        data: null,
      });
    }

    const isOwner = task.project.ownerId === currentUserId;
    const isCreator = task.createdById === currentUserId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({
        success: false,
        message:
          "Bạn không có quyền xóa công việc này (chỉ Chủ dự án hoặc Người tạo mới được xóa).",
        data: null,
      });
    }

    await prisma.task.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa công việc thành công.",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa công việc.",
      data: error.message,
    });
  }
};
