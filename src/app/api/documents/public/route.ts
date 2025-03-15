import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 获取所有公开文档
export async function GET() {
  try {
    // 使用类型断言来解决 Prisma 客户端类型问题
    const documents = await (prisma as any).document.findMany({
      where: {
        isPublic: true,
      },
      orderBy: [
        { updatedAt: 'desc' }, // 首先按更新时间降序排序
        { order: 'asc' },      // 然后按顺序号升序排序
      ],
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    // 处理日期并添加作者信息
    const processedDocuments = documents.map((doc: any) => ({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      authorName: doc.user?.name || '未知用户',
      user: undefined // 移除完整的user对象，只保留authorName
    }));
    
    return NextResponse.json(processedDocuments);
  } catch (error) {
    console.error('Error fetching public documents:', error);
    return NextResponse.json(
      { error: '获取公开文档失败' },
      { status: 500 }
    );
  }
}
