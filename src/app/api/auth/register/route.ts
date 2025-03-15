import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, verificationCode } = body;

    if (!email || !password || !verificationCode) {
      return NextResponse.json(
        { error: "邮箱、密码和验证码都是必填项" },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "请先获取验证码" },
        { status: 400 }
      );
    }
    
    // 验证验证码
    if (existingUser.verificationCode !== verificationCode) {
      return NextResponse.json(
        { error: "验证码不正确" },
        { status: 400 }
      );
    }
    
    // 检查验证码是否过期
    if (existingUser.codeExpiry && new Date() > new Date(existingUser.codeExpiry)) {
      return NextResponse.json(
        { error: "验证码已过期，请重新获取" },
        { status: 400 }
      );
    }
    
    // 如果用户已验证邮箱，不允许再次注册
    if (existingUser.emailVerified) {
      return NextResponse.json(
        { error: "该邮箱已注册，请直接登录" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 更新用户信息
    const user = await prisma.user.update({
      where: {
        email,
      },
      data: {
        name,
        password: hashedPassword,
        emailVerified: true,
        verificationCode: null,
        codeExpiry: null,
      },
    });

    // Don't return the password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        user: userWithoutPassword,
        message: "User registered successfully" 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
