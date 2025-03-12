import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateDocumentInput } from '@/types/document';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const document = await prisma.document.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Convert dates to ISO strings
    const processedDocument = {
      ...document,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };

    return NextResponse.json(processedDocument);
  } catch (error) {
    console.error('Failed to fetch document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// 获取所有子文档ID的辅助函数
async function getAllChildIds(documentId: string): Promise<string[]> {
  const children = await prisma.document.findMany({
    where: { parentId: documentId },
    select: { id: true }
  });
  
  const childIds = children.map(child => child.id);
  const descendantIds = await Promise.all(
    childIds.map(id => getAllChildIds(id))
  );
  
  return [...childIds, ...descendantIds.flat()];
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, content, parentId } = body;

    console.log('[DOCUMENT_UPDATE] Request body:', body);
    console.log('[DOCUMENT_UPDATE] Parsed values:', {
      id: params.id,
      title,
      parentId,
      hasParentId: 'parentId' in body,
      hasContent: !!content
    });

    // 检查文档是否存在
    const existingDoc = await prisma.document.findUnique({
      where: { id: params.id },
      include: { children: true }
    });

    if (!existingDoc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // 如果要更新parentId，检查是否会造成循环引用
    if (parentId && parentId !== existingDoc.parentId) {
      // 获取所有子文档ID
      const childIds = await getAllChildIds(params.id);
      
      // 检查新的父文档是否是当前文档的子文档
      if (childIds.includes(parentId)) {
        return NextResponse.json(
          { error: "Cannot move a document to its own descendant" },
          { status: 400 }
        );
      }
    }

    // 如果文档要变成独立文档（parentId 是空字符串）
    if ('parentId' in body && parentId === '') {
      console.log('[DOCUMENT_UPDATE] Making document independent:', params.id);

      // 获取当前根级别文档的最大 order
      const maxOrderResult = await prisma.document.aggregate({
        where: { parentId: null },
        _max: { order: true }
      });

      const newOrder = (maxOrderResult._max.order ?? -1) + 1;

      // 更新文档，显式设置 parentId 为 null
      const document = await prisma.$transaction(async (prisma) => {
        // 先更新文档本身
        const updatedDoc = await prisma.document.update({
          where: { id: params.id },
          data: {
            title: title ?? undefined,
            content: content ?? undefined,
            parentId: null,
            order: newOrder,
            updatedAt: new Date()
          }
        });

        console.log('[DOCUMENT_UPDATE] Document made independent:', {
          id: updatedDoc.id,
          parentId: updatedDoc.parentId,
          order: updatedDoc.order
        });

        return updatedDoc;
      });

      return NextResponse.json({
        ...document,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString()
      });
    }

    // 常规更新
    const updateData: {
      title?: string;
      content?: string;
      updatedAt: Date;
      parentId?: string | null;
    } = {
      title: title ?? undefined,
      content: content ?? undefined,
      updatedAt: new Date()
    };

    // 只有当请求中明确包含 parentId 字段时才更新它
    if ('parentId' in body) {
      // 当 parentId 是空字符串时，我们应该将其设置为 null
      updateData.parentId = parentId === '' ? null : parentId;
      console.log('[DOCUMENT_UPDATE] Setting parentId:', {
        id: params.id,
        newParentId: updateData.parentId,
        originalValue: parentId
      });
    }

    const document = await prisma.document.update({
      where: { id: params.id },
      data: updateData
    });

    console.log('[DOCUMENT_UPDATE] Document updated:', {
      id: document.id,
      parentId: document.parentId,
      updateType: 'parentId' in body ? 'with parentId' : 'without parentId'
    });

    return NextResponse.json({
      ...document,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString()
    });
  } catch (error) {
    console.error("[DOCUMENT_UPDATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const document = await prisma.document.findUnique({
      where: {
        id: params.id,
      },
      include: {
        children: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // 递归删除子文档
    async function deleteDocumentWithChildren(documentId: string) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: { children: true },
      });

      if (doc) {
        for (const child of doc.children) {
          await deleteDocumentWithChildren(child.id);
        }

        await prisma.document.delete({
          where: { id: documentId },
        });
      }
    }

    await deleteDocumentWithChildren(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 