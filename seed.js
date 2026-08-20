import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const testDatabase = async () => {
  try {
    // 1. Thêm 1 User mẫu
    const user = await prisma.user.create({
      data: {
        fullName: "Nguyen Van A",
        email: `vana_${Date.now()}@example.com`,
        password: "hashed_password_123",
        role: "USER",
      },
    });
    console.log(" Thêm User thành công:", user);

    // 2. Thêm 1 Project mẫu do User trên làm chủ
    const project = await prisma.project.create({
      data: {
        name: "Dự án Phát triển Web Task Management",
        description: "Demo kết nối MySQL qua Prisma ORM (ES Module)",
        ownerId: user.id,
      },
    });
    console.log(" Thêm Project thành công:", project);

    // 3. Thêm 1 Task vào Project
    const task = await prisma.task.create({
      data: {
        title: "Thiết kế cơ sở dữ liệu",
        description: "Tạo bảng và kiểm tra dữ liệu với Prisma",
        status: "DONE",
        priority: "HIGH",
        projectId: project.id,
        createdById: user.id,
        assigneeId: user.id,
      },
    });
    console.log(" Thêm Task thành công:", task);
  } catch (error) {
    console.error(" Lỗi khi thêm dữ liệu:", error);
  } finally {
    await prisma.$disconnect();
  }
};

testDatabase();
