import { NextResponse } from 'next/server';
import { AIConfig, AIMessage } from '@/types/ai';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const SILICONFLOW_API_URL = 'https://api.siliconflow.com/v1/chat/completions';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { messages, config } = await request.json();
    
    if (!config.apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    let apiUrl: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let body: any = {
      messages,
      temperature: config.temperature || 0.7,
      stream: true,
    };

    switch (config.provider) {
      case 'deepseek':
        apiUrl = DEEPSEEK_API_URL;
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        body.model = config.model || 'deepseek-chat';
        body.max_tokens = config.maxTokens || 2000;
        break;
      case 'siliconflow':
        apiUrl = SILICONFLOW_API_URL;
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        body.model = config.model || 'siliconflow-chat';
        body.max_tokens = config.maxTokens || 2000;
        break;
      case 'ollama':
        apiUrl = `${config.apiKey}/api/chat`;
        // 检查模型是否可用
        try {
          const modelResponse = await fetch(`${config.apiKey}/api/tags`);
          if (!modelResponse.ok) {
            throw new Error('Failed to fetch Ollama models');
          }
          const modelData = await modelResponse.json();
          const availableModels = modelData.models.map((model: { name: string }) => model.name);
          
          // 如果指定的模型不可用，使用第一个可用的模型
          if (!config.model || !availableModels.includes(config.model)) {
            body.model = availableModels[0];
          } else {
            body.model = config.model;
          }
        } catch (error) {
          console.error('Failed to check Ollama models:', error);
          // 如果无法获取模型列表，使用配置的模型或默认值
          body.model = config.model || 'llama2';
        }

        body = {
          model: body.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: true,
          options: {
            temperature: config.temperature || 0.7,
          },
        };
        break;
      default:
        throw new Error('Unsupported AI provider');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get AI response');
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }

            const chunk = new TextDecoder().decode(value);
            const lines = chunk
              .split('\n')
              .filter(line => line.trim() && (
                line.trim().startsWith('data: ') || 
                config.provider === 'ollama'
              ));

            for (const line of lines) {
              const data = line.startsWith('data: ') ? 
                line.replace('data: ', '').trim() : 
                line.trim();

              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                let content = '';
                let isComplete = false;

                if (config.provider === 'ollama') {
                  content = parsed.message?.content || '';
                  isComplete = parsed.done || false;
                } else {
                  content = parsed.choices[0]?.delta?.content || '';
                  isComplete = parsed.choices[0]?.finish_reason === 'stop';
                }

                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({
                      content,
                      isComplete,
                    }) + '\n'
                  )
                );

                if (isComplete) {
                  controller.close();
                  break;
                }
              } catch (e) {
                console.error('Failed to parse chunk:', e);
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 