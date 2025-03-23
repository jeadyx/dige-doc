import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { apiUrl } = await request.json();
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format (basic validation)
    try {
      new URL(apiUrl);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid API URL format' },
        { status: 400 }
      );
    }

    // 检查是否为本地地址
    const isLocalUrl = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
    
    if (isLocalUrl) {
      // 对于本地Ollama服务，使用较短的超时时间
      // 注意：服务器可能无法访问用户本地的Ollama服务
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
      
      try {
        // Make the request to Ollama API with timeout
        const response = await fetch(`${apiUrl}/api/tags`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to fetch Ollama models: ${error}`);
        }
        
        const data = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        clearTimeout(timeoutId);
        
        // 检查是否为超时错误
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`连接本地Ollama服务(${apiUrl})超时`);
          return NextResponse.json(
            { 
              error: `无法连接到本地Ollama服务，请确保Ollama已在您的计算机上启动并运行在${apiUrl}。如果您已确认服务正在运行，请尝试在浏览器中直接连接，绕过服务器。`,
              models: [] // 返回空模型列表
            },
            { status: 408 } // 请求超时状态码
          );
        }
        
        console.error('Ollama模型API错误:', error);
        return NextResponse.json(
          { 
            error: `无法连接到本地Ollama服务: ${error instanceof Error ? error.message : '未知错误'}。请确保Ollama已在您的计算机上启动。`,
            models: [] // 返回空模型列表
          },
          { status: 502 } // Bad Gateway
        );
      }
    } else {
      // 对于非本地地址，使用常规请求
      try {
        // Make the request to Ollama API
        const response = await fetch(`${apiUrl}/api/tags`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to fetch Ollama models: ${error}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        console.error('Ollama models API error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Ollama models API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 