import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // 更新 admin@example.com 用户为管理员
    const updatedUser = await prisma.user.update({
      where: {
        email: 'admin@example.com',
      },
      data: {
        isAdmin: true,
      },
    });

    console.log('管理员权限更新成功:', updatedUser);
  } catch (error) {
    console.error('更新管理员权限失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
