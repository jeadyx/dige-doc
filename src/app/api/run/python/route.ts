import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    // 使用 Judge0 API，但这次是从服务器端调用
    const submitResponse = await fetch('https://api.judge0.com/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_code: code,
        language_id: 71, // Python 3
      }),
    });

    if (!submitResponse.ok) {
      return NextResponse.json({ error: 'API 请求失败' }, { status: 500 });
    }

    const { token } = await submitResponse.json();

    // 轮询获取结果
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const resultResponse = await fetch(`https://api.judge0.com/submissions/${token}`);
      if (!resultResponse.ok) continue;

      const result = await resultResponse.json();
      if (result.status.id === 3) { // 3 表示执行完成
        return NextResponse.json({ output: result.stdout || '(无输出)' });
      } else if (result.status.id >= 4) { // 错误状态
        return NextResponse.json({ error: result.stderr || result.compile_output || '执行错误' });
      }
    }

    return NextResponse.json({ error: '执行超时' }, { status: 408 });
  } catch (error) {
    console.error('Python execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 