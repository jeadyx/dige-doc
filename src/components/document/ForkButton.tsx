'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

// 内联实现简单的Tooltip组件，避免导入问题
interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

function Tooltip({ children, content }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <div className="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded shadow-sm whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1">
          {content}
          <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 top-full -translate-y-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
}

interface ForkButtonProps {
  documentId: string;
  onFork: (documentId: string) => Promise<void>;
  disabled?: boolean;
  forkCount?: number; // 添加fork计数属性
}

export default function ForkButton({ documentId, onFork, disabled = false, forkCount = 0 }: ForkButtonProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFork = async () => {
    if (!session?.user) {
      alert('请先登录后再Fork文档');
      return;
    }
    
    if (disabled) {
      return;
    }
    
    setIsLoading(true);
    try {
      await onFork(documentId);
    } catch (error) {
      console.error('Fork文档失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const buttonClass = `
    inline-flex items-center px-2 py-1 text-xs font-medium rounded
    ${disabled || !session?.user
      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'}
    transition-colors duration-200
  `;
  
  const tooltipContent = !session?.user
    ? '请先登录后再Fork文档'
    : disabled
    ? '无法Fork此文档'
    : '创建此文档的副本作为子文档';
  
  return (
    <div className="flex items-center gap-1">
      <Tooltip content={tooltipContent}>
        <button
          className={buttonClass}
          onClick={handleFork}
          disabled={disabled || !session?.user || isLoading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
            />
          </svg>
          {isLoading ? '处理中...' : 'Fork'}
        </button>
      </Tooltip>
      
      {/* Fork计数标签 */}
      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
        {forkCount}
      </span>
    </div>
  );
}
