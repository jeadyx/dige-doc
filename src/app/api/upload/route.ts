import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 在实际应用中，这里应该上传到云存储服务
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const fileName = `${Date.now()}-${file.name}`;
    const path = join(uploadDir, fileName);
    
    await writeFile(path, buffer);
    
    return NextResponse.json({
      url: `/uploads/${fileName}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
} 