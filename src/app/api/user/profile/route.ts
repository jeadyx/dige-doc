import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 获取用户资料
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // 使用类型断言来解决 Prisma 客户端类型问题
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        lastProfileUpdate: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: '获取用户资料失败' },
      { status: 500 }
    );
  }
}

// 更新用户资料
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const data = await request.json();
    
    // 检查用户是否存在
    // 使用类型断言来解决 Prisma 客户端类型问题
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 检查上次更新时间，限制每周只能更新一次
    if (user.lastProfileUpdate) {
      const lastUpdate = new Date(user.lastProfileUpdate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        return NextResponse.json(
          { error: '每周只能修改一次个人资料', nextUpdateAllowed: new Date(lastUpdate.getTime() + 7 * 24 * 60 * 60 * 1000) },
          { status: 429 }
        );
      }
    }
    
    // 更新用户资料
    // 使用类型断言来解决 Prisma 客户端类型问题
    const updatedUser = await (prisma as any).user.update({
      where: { id: userId },
      data: {
        name: data.name,
        lastProfileUpdate: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastProfileUpdate: true,
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: '更新用户资料失败' },
      { status: 500 }
    );
  }
}
