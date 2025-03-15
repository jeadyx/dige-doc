const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // 管理员账户信息
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123'; // 这只是示例密码，生产环境应使用更强的密码
  const adminName = '管理员';

  try {
    // 检查账户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      console.log('管理员账户已存在');
      return;
    }

    // 对密码进行加密
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 创建管理员账户
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
      }
    });

    console.log('管理员账户创建成功:', admin);
  } catch (error) {
    console.error('创建管理员账户时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
