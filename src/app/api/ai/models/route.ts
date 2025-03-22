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