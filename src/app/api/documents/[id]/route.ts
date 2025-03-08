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

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body: UpdateDocumentInput = await request.json();
    const { title, content, parentId } = body;

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

    const updatedDocument = await prisma.document.update({
      where: {
        id: params.id,
      },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(parentId !== undefined && { parentId }),
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
  } catch (error) {
    console.error('Failed to update document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
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