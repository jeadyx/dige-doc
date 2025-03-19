import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@digidoc.com';
    const adminPassword = 'Admin@123456'; // 默认密码

    try {
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!existingAdmin) {
            const hashedPassword = await hash(adminPassword, 10);
            await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    name: 'Admin',
                    isAdmin: true,
                    emailVerified: true,
                }
            });
            console.log('管理员账户创建成功！');
            console.log('邮箱:', adminEmail);
            console.log('密码:', adminPassword);
        } else {
            console.log('管理员账户已存在');
        }
    } catch (error) {
        console.error('创建管理员账户时出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 