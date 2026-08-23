import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Không tìm thấy Token xác thực (Authorization Header).",
      data: null,
    });
  }

  // Header định dạng: "Bearer <token>"
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ.",
      data: null,
    });
  }

  try {
    // Giải mã token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret",
    );
    req.user = decoded; // Gán { id, email } vào req.user
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Token đã hết hạn hoặc không hợp lệ.",
      data: error.message,
    });
  }
};
