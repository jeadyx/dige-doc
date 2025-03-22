'use client';

import { useState, useRef, useEffect } from 'react';
import { AIConfig, AIMessage, AIResponse, AI_PROVIDERS } from '@/types/ai';
import { PaperAirplaneIcon, Cog6ToothIcon, ChevronDownIcon, ChevronUpIcon, ExclamationCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { encryptText, decryptText } from '@/lib/encryption';

interface AIChatProps {
  onInsertText: (text: string) => void;
  config: AIConfig;
  onConfigChange: (config: AIConfig) => void;
}

// 默认的 API Keys（实际使用时应该从环境变量获取）
const DEFAULT_API_KEYS: Record<string, string> = {
  deepseek: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
  siliconflow: process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY || '',
  ollama: 'http://localhost:11434', // Ollama 默认地址
};

// 本地存储的键名
const STORED_API_KEYS_KEY = 'dige-doc-api-keys';

export default function AIChat({ onInsertText, config, onConfigChange }: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<Array<{ id: string; name: string; maxTokens: number }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const providerMenuRef = useRef<HTMLDivElement>(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (providerMenuRef.current && !providerMenuRef.current.contains(event.target as Node)) {
        setShowProviderMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取 Ollama 可用模型
  useEffect(() => {
    const fetchOllamaModels = async () => {
      if (config.provider === 'ollama') {
        try {
          const apiUrl = config.apiKey || DEFAULT_API_KEYS.ollama;
          
          // 使用我们的代理 API 端点
          const response = await fetch('/api/ai/models', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              apiUrl: apiUrl,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            const models = data.models.map((model: { name: string }) => ({
              id: model.name,
              name: model.name,
              maxTokens: 8192 // 默认值
            }));
            setOllamaModels(models);
            
            // 如果当前选择的模型不在可用模型列表中，选择第一个可用模型
            if (models.length > 0 && !models.find((m: { id: string; name: string; maxTokens: number }) => m.id === config.model)) {
              onConfigChange({
                ...config,
                model: models[0].id
              });
            }
          } else {
            const errorData = await response.json();
            console.error('Failed to fetch Ollama models:', errorData.error || 'Unknown error');
            setError(`无法获取 Ollama 模型: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Failed to fetch Ollama models:', error);
          setError(`无法获取 Ollama 模型: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    };

    fetchOllamaModels();
  }, [config.provider, config.apiKey]);

  // 从本地存储加载加密的API密钥
  useEffect(() => {
    const loadSavedApiKeys = () => {
      try {
        const savedKeysEncrypted = localStorage.getItem(STORED_API_KEYS_KEY);
        if (savedKeysEncrypted) {
          const savedKeysJSON = decryptText(savedKeysEncrypted);
          const savedKeys = JSON.parse(savedKeysJSON);
          
          // 如果当前provider有保存的密钥且当前没有设置密钥，则使用保存的密钥
          if (savedKeys[config.provider] && !config.apiKey) {
            onConfigChange({
              ...config,
              apiKey: savedKeys[config.provider]
            });
            console.log(`已从本地存储加载 ${config.provider} API 密钥`);
          }
        }
      } catch (error) {
        console.error('加载API密钥时出错:', error);
      }
    };
    
    loadSavedApiKeys();
  }, [config.provider]);

  // 保存API密钥到本地存储
  const saveApiKey = (provider: string, apiKey: string) => {
    try {
      // 加载现有的密钥
      const savedKeysEncrypted = localStorage.getItem(STORED_API_KEYS_KEY);
      let savedKeys: Record<string, string> = {};
      
      if (savedKeysEncrypted) {
        const savedKeysJSON = decryptText(savedKeysEncrypted);
        savedKeys = JSON.parse(savedKeysJSON);
      }
      
      // 更新密钥
      savedKeys[provider] = apiKey;
      
      // 加密后保存
      const keysJSON = JSON.stringify(savedKeys);
      const encryptedKeys = encryptText(keysJSON);
      localStorage.setItem(STORED_API_KEYS_KEY, encryptedKeys);
      
      console.log(`已加密保存 ${provider} API 密钥到本地存储`);
      
      // 显示安全提示
      setShowSecurityNotice(true);
      setTimeout(() => setShowSecurityNotice(false), 5000); // 5秒后隐藏提示
    } catch (error) {
      console.error('保存API密钥时出错:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingResponse('');
    setError(null);

    try {
      // 检查是否配置了必要的API密钥
      if (!config.apiKey && !DEFAULT_API_KEYS[config.provider]) {
        throw new Error('请先配置 API Key');
      }

      console.log(`发送请求到 ${config.provider} API，消息:`, userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : ''));
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          config: {
            ...config,
            apiKey: config.apiKey || DEFAULT_API_KEYS[config.provider],
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API响应错误:', errorData);
        throw new Error(errorData.error || '获取 AI 响应失败');
      }
      
      console.log('开始接收流式响应');
      
      // 使用更原生的方式处理流
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullResponse = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('流读取完成');
              // 处理缓冲区中剩余的内容
              if (buffer.trim()) {
                try {
                  const data = JSON.parse(buffer);
                  if (data.content) {
                    fullResponse += data.content;
                    setStreamingResponse(fullResponse);
                  }
                  if (data.isComplete && fullResponse) {
                    setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
                  }
                } catch (err) {
                  console.error('解析最终缓冲区错误:', err, '原始数据:', buffer);
                }
              }
              break;
            }
            
            // 解码字节流为文本
            const chunk = decoder.decode(value, { stream: true });
            console.log('收到块:', chunk.substring(0, 30) + (chunk.length > 30 ? '...' : ''));
            
            // 添加到缓冲区并按行处理
            buffer += chunk;
            const lines = buffer.split('\n');
            // 保留最后一行，可能是不完整的
            buffer = lines.pop() || '';
            
            // 处理完整行
            for (const line of lines) {
              if (!line.trim()) continue;
              
              try {
                console.log('处理行:', line.substring(0, 30) + (line.length > 30 ? '...' : ''));
                const data = JSON.parse(line);
                
                if (data.content) {
                  console.log('接收内容:', data.content.substring(0, 20) + (data.content.length > 20 ? '...' : ''));
                  fullResponse += data.content;
                  setStreamingResponse(fullResponse);
                }
                
                if (data.isComplete) {
                  console.log('流完成, 最终响应长度:', fullResponse.length);
                  if (fullResponse) {
                    setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
                  }
                  setStreamingResponse('');
                }
              } catch (err) {
                console.error('解析错误:', err, '原始行:', line);
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        throw new Error('无法从服务器获取响应流');
      }
    } catch (error) {
      console.error('聊天错误:', error);
      setError(error instanceof Error ? error.message : '发送消息失败');
      // 添加错误消息到对话中
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `错误: ${error instanceof Error ? error.message : '发送消息失败'}`
      }]);
    } finally {
      setIsLoading(false);
      setStreamingResponse('');
    }
  };

  const handleProviderChange = (provider: string) => {
    try {
      // 加载保存的密钥
      const savedKeysEncrypted = localStorage.getItem(STORED_API_KEYS_KEY);
      let apiKey = '';
      
      if (savedKeysEncrypted) {
        const savedKeysJSON = decryptText(savedKeysEncrypted);
        const savedKeys = JSON.parse(savedKeysJSON);
        apiKey = savedKeys[provider] || '';
      }
      
      onConfigChange({
        ...config,
        provider: provider as AIConfig['provider'],
        model: AI_PROVIDERS[provider].defaultModel,
        apiKey: apiKey
      });
      setShowProviderMenu(false);
    } catch (error) {
      console.error('切换提供商时出错:', error);
      onConfigChange({
        ...config,
        provider: provider as AIConfig['provider'],
        model: AI_PROVIDERS[provider].defaultModel,
      });
      setShowProviderMenu(false);
    }
  };

  const handleInsert = (content: string) => {
    onInsertText(content);
  };

  const selectedProvider = AI_PROVIDERS[config.provider];
  const availableModels = config.provider === 'ollama' ? ollamaModels : selectedProvider.models;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 border-b border-slate-200">
        <div className="relative flex-shrink-0" ref={providerMenuRef}>
          <button
            onClick={() => setShowProviderMenu(!showProviderMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-base">{selectedProvider.icon}</span>
            <span className="truncate max-w-[80px]">{selectedProvider.name}</span>
            <ChevronDownIcon className="w-3.5 h-3.5 flex-shrink-0" />
          </button>

          {showProviderMenu && (
            <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                <button
                  key={key}
                  onClick={() => handleProviderChange(key)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors text-left',
                    key === config.provider && 'bg-slate-50'
                  )}
                >
                  <span className="text-xl flex-shrink-0">{provider.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 truncate">{provider.name}</div>
                    <div className="text-xs text-slate-500 truncate">{provider.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex-shrink-0" ref={modelMenuRef}>
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium bg-white border rounded-lg transition-colors",
              showModelMenu ? "border-indigo-500 text-indigo-600" : "border-slate-300 text-slate-700 hover:bg-slate-50"
            )}
          >
            <span className="truncate max-w-[80px]">{availableModels.find(m => m.id === config.model)?.name || selectedProvider.defaultModel}</span>
            {showModelMenu ? (
              <ChevronUpIcon className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <ChevronDownIcon className="w-3.5 h-3.5 flex-shrink-0" />
            )}
          </button>

          {showModelMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onConfigChange({ ...config, model: model.id });
                    setShowModelMenu(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors',
                    model.id === config.model
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span className="truncate">{model.name}</span>
                  {model.id === config.model && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className={cn(
            "p-1.5 rounded-lg transition-colors flex-shrink-0",
            showConfig 
              ? "bg-indigo-500 text-white hover:bg-indigo-600" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Cog6ToothIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {showConfig && (
          <div className="p-4 border-b border-slate-200 space-y-4 bg-slate-50">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {showSecurityNotice && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                <ShieldCheckIcon className="w-4 h-4 flex-shrink-0" />
                <span>API密钥已加密保存在本地浏览器中，仅在当前设备可用。我们不会将您的密钥发送到服务器。</span>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                API Key {config.provider === 'ollama' && '(服务地址)'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type={config.provider === 'ollama' ? 'text' : 'password'}
                  value={config.apiKey || ''}
                  onChange={e => onConfigChange({ ...config, apiKey: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
                  placeholder={config.provider === 'ollama' ? '输入 Ollama 服务地址' : '输入 API Key'}
                />
                <button
                  onClick={() => saveApiKey(config.provider, config.apiKey || '')}
                  className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors"
                >
                  保存
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                您的API密钥将使用加密方式仅保存在本地浏览器中，不会发送至我们的服务器。
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                温度 (0-1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature || 0.7}
                onChange={e => onConfigChange({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-16rem)]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'p-4 rounded-lg max-w-[85%]',
                message.role === 'user'
                  ? 'bg-indigo-500 text-white ml-auto'
                  : message.content.startsWith('错误:')
                    ? 'bg-red-50 text-red-600'
                    : 'bg-slate-100 text-slate-900'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.role === 'assistant' && !message.content.startsWith('错误:') && (
                <button
                  onClick={() => handleInsert(message.content)}
                  className="mt-2 text-xs text-slate-500 hover:text-slate-700"
                >
                  插入到编辑器
                </button>
              )}
            </div>
          ))}
          {streamingResponse && (
            <div className="bg-slate-100 text-slate-900 p-4 rounded-lg max-w-[85%]">
              <p className="whitespace-pre-wrap">{streamingResponse}</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isLoading ? "AI 正在回复..." : "输入消息..."}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors flex items-center justify-center',
                isLoading
                  ? 'bg-slate-300 cursor-not-allowed'
                  : !input.trim()
                  ? 'bg-slate-200 cursor-not-allowed text-slate-500'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              )}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          {error && !showConfig && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
              <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 