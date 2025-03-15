import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 检查 admin 用户是否已存在
  const adminExists = await (prisma as any).user.findUnique({
    where: { email: 'admin@example.com' },
  });

  // 检查 test 用户是否已存在
  const testExists = await (prisma as any).user.findUnique({
    where: { email: 'test@example.com' },
  });

  // 如果 admin 用户不存在，则创建
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await (prisma as any).user.create({
      data: {
        email: 'admin@example.com',
        name: '管理员',
        password: hashedPassword,
      },
    });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists');
  }

  // 如果 test 用户不存在，则创建
  if (!testExists) {
    const hashedPassword = await bcrypt.hash('test123', 10);
    await (prisma as any).user.create({
      data: {
        email: 'test@example.com',
        name: '测试用户',
        password: hashedPassword,
      },
    });
    console.log('Test user created');
  } else {
    console.log('Test user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
