import prisma from "../db.js";

export const createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, ownerId } = req.body;

    // 1. Kiểm tra đầu vào
    if (!name || !ownerId) {
      return res.status(400).json({
        success: false,
        message: "Tên dự án (name) và ownerId là bắt buộc.",
        data: null,
      });
    }

    // 2. Lưu vào Database
    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        ownerId: Number(ownerId),
        // Tự động thêm owner vào danh sách thành viên dự án
        members: {
          create: {
            userId: Number(ownerId),
            role: "OWNER",
          },
        },
      },
      include: {
        members: true,
      },
    });

    // 3. Trả về kết quả
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
    const { userId } = req.query; // Nhận ?userId=... nếu có truyền

    // Nếu có truyền userId thì chỉ lấy các dự án user đó tham gia
    const whereCondition = userId
      ? {
          members: {
            some: {
              userId: Number(userId),
            },
          },
        }
      : {};

    const projects = await prisma.project.findMany({
      where: whereCondition,
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        _count: {
          select: { tasks: true }, // Đếm tổng số task hiện có trong dự án
        },
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
