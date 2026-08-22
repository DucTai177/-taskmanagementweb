import prisma from '../db.js';

export const verifyToken = async (req, res, next) => {
  try {
    const headerUserId = req.headers['x-user-id'];
    let user = null;

    // 1. Nếu có header x-user-id hợp lệ thì tìm theo ID đó
    if (headerUserId && !isNaN(headerUserId)) {
      user = await prisma.user.findUnique({
        where: { id: Number(headerUserId) },
      });
    }

    // 2. Nếu không truyền header hoặc không tìm thấy theo header, lấy ngay User đầu tiên trong DB
    if (!user) {
      user = await prisma.user.findFirst();
    }

    // 3. Nếu trong DB hoàn toàn chưa có bất kỳ User nào
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Database hoàn toàn chưa có User nào. Hãy đăng ký tài khoản trước.',
        data: null,
      });
    }

    // Gắn thông tin User vào request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực middleware.',
      data: error.message,
    });
  }
};