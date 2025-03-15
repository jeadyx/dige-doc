import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateDocumentInput } from '@/types/document';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 如果用户已登录，获取用户自己的文档和所有公开文档
    // 如果用户未登录，只获取公开文档
    let whereCondition: any = {};
    
    if (session?.user) {
      whereCondition = {
        OR: [
          { isPublic: true },
          { userId: session.user.id }
        ]
      };
    } else {
      whereCondition = {
        isPublic: true
      };
    }
    
    // 使用类型断言来解决 Prisma 客户端类型问题
    const documents = await (prisma as any).document.findMany({
      where: whereCondition,
      orderBy: [
        { updatedAt: 'desc' },  // 首先按更新时间降序排列，最新的在前面
        { parentId: 'asc' },    // 然后按父文档ID排序
        { order: 'asc' },       // 最后按文档顺序排序
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

    // Convert dates to ISO strings for proper JSON serialization and add author name
    const processedDocuments = documents.map((doc: any) => ({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      authorName: doc.user?.name || '未知用户',
      user: undefined // 移除完整的user对象，只保留authorName
    }));

    return NextResponse.json(processedDocuments);
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session?.user) {
      return NextResponse.json(
        { error: '需要登录才能创建文档' },
        { status: 401 }
      );
    }
    
    const body: CreateDocumentInput = await request.json();
    const { title, content = '', parentId, style = '{}', isPublic = false } = body;

    // Get the maximum order value for the same parent
    const maxOrder = await prisma.document.aggregate({
      where: {
        parentId: parentId || null,
      },
      _max: {
        order: true,
      },
    });

    // 使用any类型暂时绕过TypeScript类型检查
    const documentData: any = {
      title,
      content,
      parentId,
      style,
      isPublic,
      userId: session.user.id,
      order: (maxOrder._max.order ?? -1) + 1,
    };

    const document = await prisma.document.create({
      data: documentData,
    });

    // Convert dates to ISO strings
    const processedDocument = {
      ...document,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };

    return NextResponse.json(processedDocument);
  } catch (error) {
    console.error('Failed to create document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;
  
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    return NextResponse.json(
      { error: 'Document not found' },
      { status: 404 }
    );
  }

  const updatedDocument = await prisma.document.update({
    where: { id },
    data: {
      ...document,
      ...updates,
      updatedAt: new Date(),
    },
  });

  // Convert dates to ISO strings
  const processedDocument = {
    ...updatedDocument,
    createdAt: updatedDocument.createdAt.toISOString(),
    updatedAt: updatedDocument.updatedAt.toISOString(),
  };

  return NextResponse.json(processedDocument);
} 