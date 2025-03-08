import { NextResponse } from 'next/server';
import { ExportFormat } from '@/types/document';

export async function POST(request: Request) {
  try {
    const { content, format } = await request.json();
    
    if (!content || !format) {
      return NextResponse.json(
        { error: 'Missing content or format' },
        { status: 400 }
      );
    }

    let result: string;
    let fileName: string;
    let contentType: string;

    switch (format as ExportFormat) {
      case 'md':
        result = content;
        fileName = 'document.md';
        contentType = 'text/markdown';
        break;
      
      case 'html':
        // 这里应该使用proper的markdown到html转换器
        result = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Exported Document</title>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `;
        fileName = 'document.html';
        contentType = 'text/html';
        break;
      
      case 'docx':
        // 这里应该使用proper的markdown到docx转换器
        return NextResponse.json(
          { error: 'DOCX export not implemented yet' },
          { status: 501 }
        );
      
      default:
        return NextResponse.json(
          { error: 'Invalid format' },
          { status: 400 }
        );
    }

    // 在实际应用中，我们应该生成文件并返回下载链接
    return new NextResponse(result, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
} 