import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '请提供邮箱地址' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: '该邮箱未注册' }, { status: 404 });
    }

    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: '重置密码',
      html: `
        <h1>重置密码</h1>
        <p>您好，</p>
        <p>我们收到了您的密码重置请求。请点击下面的链接重置密码：</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>此链接将在24小时后失效。如果您没有请求重置密码，请忽略此邮件。</p>
        <p>谢谢！</p>
      `,
    });

    return NextResponse.json({ message: '重置密码链接已发送到您的邮箱' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { error: '发送重置密码邮件时出错' },
      { status: 500 }
    );
  }
} 