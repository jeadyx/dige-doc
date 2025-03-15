import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 获取文档的点赞/踩统计
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    
    // 检查文档是否存在
    // 使用类型断言解决 Prisma 客户端类型问题
    const document = await (prisma as any).document.findUnique({
      where: { id: documentId },
    });
    
    if (!document) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }
    
    // 获取点赞和踩的数量
    // 使用类型断言解决 Prisma 客户端类型问题
    const [likes, dislikes] = await Promise.all([
      (prisma as any).documentReaction.count({
        where: {
          documentId,
          type: 'like',
        },
      }),
      (prisma as any).documentReaction.count({
        where: {
          documentId,
          type: 'dislike',
        },
      }),
    ]);
    
    // 获取当前用户的反应（如果已登录）
    const session = await getServerSession(authOptions);
    let userReaction = null;
    
    if (session?.user) {
      // 使用类型断言解决 Prisma 客户端类型问题
      const reaction = await (prisma as any).documentReaction.findUnique({
        where: {
          documentId_userId: {
            documentId,
            userId: session.user.id,
          },
        },
        select: {
          type: true,
        },
      });
      
      userReaction = reaction?.type || null;
    }
    
    return NextResponse.json({
      likes,
      dislikes,
      userReaction,
    });
  } catch (error) {
    console.error('Error fetching document reactions:', error);
    return NextResponse.json(
      { error: '获取文档反应失败' },
      { status: 500 }
    );
  }
}

// 添加或更新文档反应（点赞/踩）
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }
    
    const documentId = params.id;
    const userId = session.user.id;
    const { type } = await request.json();
    
    if (type !== 'like' && type !== 'dislike' && type !== null) {
      return NextResponse.json(
        { error: '无效的反应类型' },
        { status: 400 }
      );
    }
    
    // 检查文档是否存在
    // 使用类型断言解决 Prisma 客户端类型问题
    const document = await (prisma as any).document.findUnique({
      where: { id: documentId },
    });
    
    if (!document) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }
    
    // 查找现有反应
    // 使用类型断言解决 Prisma 客户端类型问题
    const existingReaction = await (prisma as any).documentReaction.findUnique({
      where: {
        documentId_userId: {
          documentId,
          userId,
        },
      },
    });
    
    // 如果传入的类型为null，则删除反应（取消点赞/踩）
    if (type === null) {
      if (existingReaction) {
        // 使用类型断言解决 Prisma 客户端类型问题
        await (prisma as any).documentReaction.delete({
          where: {
            id: existingReaction.id,
          },
        });
      }
      
      return NextResponse.json({ success: true, action: 'removed' });
    }
    
    // 如果已有反应，更新它；否则创建新反应
    if (existingReaction) {
      // 如果类型相同，则不做任何更改
      if (existingReaction.type === type) {
        return NextResponse.json({ 
          success: true, 
          action: 'unchanged',
          type
        });
      }
      
      // 更新反应类型
      // 使用类型断言解决 Prisma 客户端类型问题
      await (prisma as any).documentReaction.update({
        where: {
          id: existingReaction.id,
        },
        data: {
          type,
        },
      });
      
      return NextResponse.json({ 
        success: true, 
        action: 'updated',
        type
      });
    } else {
      // 创建新反应
      // 使用类型断言解决 Prisma 客户端类型问题
      await (prisma as any).documentReaction.create({
        data: {
          documentId,
          userId,
          type,
        },
      });
      
      return NextResponse.json({ 
        success: true, 
        action: 'created',
        type
      });
    }
  } catch (error) {
    console.error('Error updating document reaction:', error);
    return NextResponse.json(
      { error: '更新文档反应失败' },
      { status: 500 }
    );
  }
}
