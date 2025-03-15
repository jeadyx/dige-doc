import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateVerificationCode, sendVerificationEmail } from '@/lib/email';

// 使用类型断言解决 Prisma 类型问题
const prisma = new PrismaClient() as any;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '请提供有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 检查邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: '该邮箱已被注册并验证' },
        { status: 400 }
      );
    }

    // 生成验证码
    const verificationCode = generateVerificationCode();
    
    // 设置过期时间（10分钟后）
    const codeExpiry = new Date();
    codeExpiry.setMinutes(codeExpiry.getMinutes() + 10);

    // 如果用户已存在但未验证，更新验证码
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          verificationCode,
          codeExpiry,
        },
      });
    }

    // 发送验证码邮件
    const emailSent = await sendVerificationEmail(email, verificationCode);

    if (!emailSent) {
      return NextResponse.json(
        { error: '验证码发送失败，请稍后再试' },
        { status: 500 }
      );
    }

    // 存储验证码和邮箱的关联（如果用户尚未创建）
    if (!existingUser) {
      // 创建临时用户记录，仅包含邮箱和验证码
      await prisma.user.create({
        data: {
          email,
          verificationCode,
          codeExpiry,
          password: '', // 临时密码，注册时会更新
          name: '',
        },
      });
    }

    return NextResponse.json({
      message: '验证码已发送到您的邮箱，请查收',
    });
  } catch (error) {
    console.error('[VERIFICATION_CODE_SEND]', error);
    return NextResponse.json(
      { error: '发送验证码时出错' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
