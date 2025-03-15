import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Fork 文档 API
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session?.user) {
      return NextResponse.json(
        { error: '需要登录才能fork文档' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { documentId } = body;
    
    if (!documentId) {
      return NextResponse.json(
        { error: '缺少文档ID' },
        { status: 400 }
      );
    }
    
    // 获取原始文档
    const originalDocument = await (prisma as any).document.findUnique({
      where: { id: documentId },
      include: {
        user: {
          select: {
            name: true,
          }
        }
      }
    });
    
    if (!originalDocument) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }
    
    // 检查原始文档是否是公开的
    if (!originalDocument.isPublic) {
      return NextResponse.json(
        { error: '只能fork公开文档' },
        { status: 403 }
      );
    }
    
    // 获取当前最大顺序号
    const maxOrder = await (prisma as any).document.aggregate({
      where: {
        parentId: documentId, // 作为原始文档的子文档
      },
      _max: {
        order: true,
      },
    });
    
    // 使用事务来创建fork的文档并增加原文档的fork计数
    const forkedDocument = await prisma.$transaction(async (prisma) => {
      // 增加原文档的fork计数
      await (prisma as any).document.update({
        where: { id: documentId },
        data: {
          forkCount: {
            increment: 1
          }
        }
      });
      
      // 创建fork的文档
      return await (prisma as any).document.create({
        data: {
          title: `Fork: ${originalDocument.title}`,
          content: originalDocument.content,
          style: originalDocument.style,
          parentId: documentId, // 设置为原始文档的子文档
          isPublic: false, // 默认为私有
          userId: session.user.id,
          order: (maxOrder._max.order ?? -1) + 1,
        },
        include: {
          user: {
            select: {
              name: true,
            }
          }
        }
      });
    });
    
    // 处理返回数据
    const processedDocument = {
      ...forkedDocument,
      createdAt: forkedDocument.createdAt.toISOString(),
      updatedAt: forkedDocument.updatedAt.toISOString(),
      authorName: forkedDocument.user?.name || '未知用户',
      user: undefined // 移除完整的user对象，只保留authorName
    };
    
    return NextResponse.json(processedDocument);
  } catch (error) {
    console.error('Failed to fork document:', error);
    return NextResponse.json(
      { error: 'Fork文档失败' },
      { status: 500 }
    );
  }
}
