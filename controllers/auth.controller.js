import bcrypt from "bcrypt";
import prisma from "../db.js";

//Đăng ký
export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ fullName, email và password.",
        data: null,
      });
    }

    // 2. Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email này đã được sử dụng.",
        data: null,
      });
    }

    // 3. Mã hóa mật khẩu bằng bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Lưu User vào database (không trả về trường password)
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công.",
      data: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký.",
      data: error.message,
    });
  }
};

//Đăng nhập
// Thêm hàm login vào controllers/auth.controller.js
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Kiểm tra đầu vào
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ email và password.",
        data: null,
      });
    }

    // 2. Tìm user theo email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
        data: null,
      });
    }

    // 3. So khớp mật khẩu nhập vào với mật khẩu đã băm (hash) trong database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
        data: null,
      });
    }

    // 4. Đăng nhập thành công -> trả về thông tin user (ẩn trường password)
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công.",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng nhập.",
      data: error.message,
    });
  }
};

////////////////////////////////////////////////////////////
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
