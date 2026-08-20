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
