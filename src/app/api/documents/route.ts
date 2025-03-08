import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateDocumentInput } from '@/types/document';

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: [
        { parentId: 'asc' },
        { order: 'asc' },
        { updatedAt: 'desc' },
      ],
    });

    // Convert dates to ISO strings for proper JSON serialization
    const processedDocuments = documents.map(doc => ({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
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
    const body: CreateDocumentInput = await request.json();
    const { title, content = '', parentId } = body;

    // Get the maximum order value for the same parent
    const maxOrder = await prisma.document.aggregate({
      where: {
        parentId: parentId || null,
      },
      _max: {
        order: true,
      },
    });

    const document = await prisma.document.create({
      data: {
        title,
        content,
        parentId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
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