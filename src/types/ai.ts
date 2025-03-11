export interface AIConfig {
  provider: 'deepseek' | 'siliconflow' | 'ollama';
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  isComplete: boolean;
}

export interface AIProviderConfig {
  name: string;
  icon: string;
  description: string;
  models: Array<{
    id: string;
    name: string;
    maxTokens: number;
  }>;
  defaultModel: string;
}

export const AI_PROVIDERS: Record<string, AIProviderConfig> = {
  deepseek: {
    name: 'Deepseek',
    icon: '🧠',
    description: '专业的中文大语言模型',
    models: [
      { id: 'deepseek-chat', name: 'Deepseek Chat', maxTokens: 4096 },
      { id: 'deepseek-coder', name: 'Deepseek Coder', maxTokens: 8192 }
    ],
    defaultModel: 'deepseek-chat'
  },
  siliconflow: {
    name: '硅基流体',
    icon: '🌊',
    description: '国内领先的 AI 服务提供商',
    models: [
      { id: 'siliconflow-chat', name: 'SiliconFlow Chat', maxTokens: 4096 }
    ],
    defaultModel: 'siliconflow-chat'
  },
  ollama: {
    name: 'Ollama',
    icon: '🦙',
    description: '本地运行的开源大语言模型',
    models: [
      { id: 'llama2', name: 'Llama 2', maxTokens: 4096 },
      { id: 'mistral', name: 'Mistral', maxTokens: 8192 },
      { id: 'codellama', name: 'Code Llama', maxTokens: 16384 }
    ],
    defaultModel: 'llama2'
  }
}; 