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
