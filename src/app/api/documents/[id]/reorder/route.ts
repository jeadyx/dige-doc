import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { parentId, index } = await request.json();
    const documentId = params.id;

    // 获取同级文档
    const siblings = await prisma.document.findMany({
      where: {
        parentId: parentId || null,
      },
      orderBy: {
        order: 'asc',
      },
    });

    // 计算新的顺序值
    const currentDoc = siblings.find(doc => doc.id === documentId);
    if (!currentDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const currentIndex = siblings.findIndex(doc => doc.id === documentId);
    const updates: { id: string; order: number }[] = [];

    if (currentIndex === index) {
      // Convert dates to ISO strings
      const processedDocument = {
        ...currentDoc,
        createdAt: currentDoc.createdAt.toISOString(),
        updatedAt: currentDoc.updatedAt.toISOString(),
      };
      return NextResponse.json(processedDocument);
    }

    // 重新计算顺序
    if (currentIndex < index) {
      // 向后移动
      for (let i = 0; i < siblings.length; i++) {
        const doc = siblings[i];
        if (i === index) {
          updates.push({ id: documentId, order: i });
        }
        if (doc.id !== documentId) {
          updates.push({ id: doc.id, order: i < currentIndex || i > index ? i : i - 1 });
        }
      }
    } else {
      // 向前移动
      for (let i = 0; i < siblings.length; i++) {
        const doc = siblings[i];
        if (i === index) {
          updates.push({ id: documentId, order: i });
        }
        if (doc.id !== documentId) {
          updates.push({ id: doc.id, order: i < index || i > currentIndex ? i : i + 1 });
        }
      }
    }

    // 批量更新顺序
    await Promise.all(
      updates.map(({ id, order }) =>
        prisma.document.update({
          where: { id },
          data: { order },
        })
      )
    );

    // 返回更新后的文档
    const updatedDoc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!updatedDoc) {
      return NextResponse.json(
        { error: 'Document not found after update' },
        { status: 404 }
      );
    }

    // Convert dates to ISO strings
    const processedDocument = {
      ...updatedDoc,
      createdAt: updatedDoc.createdAt.toISOString(),
      updatedAt: updatedDoc.updatedAt.toISOString(),
    };

    return NextResponse.json(processedDocument);
  } catch (error) {
    console.error('Failed to reorder document:', error);
    return NextResponse.json(
      { error: 'Failed to reorder document' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 