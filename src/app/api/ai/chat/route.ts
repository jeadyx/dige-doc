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
          messages: messages.map((msg: AIMessage) => ({
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

    console.log('Sending request to:', apiUrl);
    console.log('Request body:', JSON.stringify(body));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API response error:', error);
      return NextResponse.json(
        { error: `API responded with status ${response.status}: ${error}` },
        { status: response.status }
      );
    }

    // 使用标准的ReadableStream来避免编码问题
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 获取原始响应的reader
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }
          
          // 用于存储部分响应
          let buffer = '';
          let decoder = new TextDecoder('utf-8');
          
          console.log('Starting to read response stream');
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('Stream reading completed');
              if (buffer.trim()) {
                console.log('Processing final buffer:', buffer);
                // 处理最后剩余的buffer
                processBuffer(buffer, controller, config);
              }
              controller.close();
              break;
            }
            
            // 解码二进制数据为文本
            const text = decoder.decode(value, { stream: true });
            console.log('Received chunk:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
            
            buffer += text;
            
            // 按行处理buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一行（可能是不完整的）
            
            for (const line of lines) {
              if (line.trim()) {
                try {
                  processLine(line, controller, config);
                } catch (err) {
                  console.error('Error processing line:', err, 'Line:', line);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error in stream processing:', err);
          controller.error(err);
        }
      }
    });
    
    // 处理单行数据的辅助函数
    function processLine(line: string, controller: ReadableStreamDefaultController, config: AIConfig) {
      // 跳过空行或[DONE]标记
      if (!line.trim() || line === '[DONE]' || line === 'data: [DONE]') {
        return;
      }
      
      // 处理SSE格式
      let jsonStr = line;
      if (line.startsWith('data: ')) {
        jsonStr = line.substring(6).trim();
      }
      
      if (!jsonStr || jsonStr === '[DONE]') {
        return;
      }
      
      console.log('Processing JSON string:', jsonStr.substring(0, 50) + (jsonStr.length > 50 ? '...' : ''));
      
      // 解析JSON
      const jsonData = JSON.parse(jsonStr);
      let content = '';
      let isComplete = false;
      
      // 根据提供者提取内容
      if (config.provider === 'ollama') {
        content = jsonData.message?.content || '';
        isComplete = jsonData.done || false;
      } else if (config.provider === 'deepseek' || config.provider === 'siliconflow') {
        if (jsonData.choices && jsonData.choices.length > 0) {
          const choice = jsonData.choices[0];
          content = choice.delta?.content || choice.message?.content || '';
          isComplete = choice.finish_reason === 'stop' || choice.finish_reason === 'length';
        }
      }
      
      // 向客户端发送响应
      if (content || isComplete) {
        const responseObj = {
          content,
          isComplete
        };
        
        console.log('Sending to client:', JSON.stringify(responseObj));
        
        // 使用TextEncoder编码为UTF-8
        const encoder = new TextEncoder();
        const rawData = JSON.stringify(responseObj) + '\n';
        
        try {
          controller.enqueue(encoder.encode(rawData));
        } catch (err) {
          console.error('Error enqueueing data:', err, 'Data:', rawData);
          // 尝试无损编码处理
          const safeData = JSON.stringify({
            content: content ? sanitizeString(content) : '',
            isComplete
          }) + '\n';
          controller.enqueue(encoder.encode(safeData));
        }
      }
    }
    
    // 处理整个buffer的辅助函数
    function processBuffer(buffer: string, controller: ReadableStreamDefaultController, config: AIConfig) {
      const lines = buffer.split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          processLine(line, controller, config);
        } catch (err) {
          console.error('Error processing buffer line:', err);
        }
      }
    }
    
    // 清理字符串，确保不会有编码问题
    function sanitizeString(str: string): string {
      // 删除或替换可能导致问题的字符
      return str.replace(/[^\x00-\x7F]/g, char => {
        try {
          // 检查字符是否可以安全编码
          new TextEncoder().encode(char);
          return char;
        } catch {
          return ''; // 如果有问题，移除该字符
        }
      });
    }

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