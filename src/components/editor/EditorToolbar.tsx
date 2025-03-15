'use client';

import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Minus,
  ChevronDown,
  Copy,
  CheckIcon,
  XCircleIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';
import { EditorStyle } from '@/types/document';
import { EditorTheme } from '../layout/RightPanel';

interface EditorToolbarProps {
  editor: Editor;
  onImageUpload: (file: File) => Promise<void>;
  onNodeSelect?: (node: { type: string; attrs?: Record<string, any>; textContent?: string; } | null) => void;
  contentStyle?: string;
  content: string;
  theme: EditorTheme;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
  initialUrl?: string;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'css', label: 'CSS' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell-session', label: 'Shell' },
  { value: 'docker', label: 'Docker' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'regex', label: 'RegEx' },
];

function ToolbarButton({ onClick, isActive, children, title, disabled }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2.5 rounded-lg transition-colors',
        isActive
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function LanguageSelect({ editor, onNodeSelect }: { editor: Editor; onNodeSelect?: (node: { type: string; attrs?: Record<string, any>; textContent?: string; } | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageSelect = useCallback((language: string) => {
    setSelectedLanguage(language);
    setIsOpen(false);
    editor.chain()
      .focus()
      .toggleCodeBlock({ language })
      .run();

    // 更新选中节点信息
    if (onNodeSelect) {
      const { $head } = editor.state.selection;
      const node = $head.parent;
      if (node.type.name === 'codeBlock') {
        onNodeSelect({
          type: node.type.name,
          attrs: { ...node.attrs, language },
          textContent: node.textContent,
        });
      }
    }
  }, [editor, onNodeSelect]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors',
          editor.isActive('codeBlock')
            ? 'bg-gray-200 text-gray-900'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <Code className="w-5 h-5" />
        <span className="hidden sm:inline">
          {selectedLanguage ? LANGUAGES.find(l => l.value === selectedLanguage)?.label : '代码块'}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-64 overflow-y-auto">
          {LANGUAGES.map((language) => (
            <button
              key={language.value}
              onClick={() => handleLanguageSelect(language.value)}
              className={cn(
                'w-full text-left px-4 py-2 text-sm transition-colors',
                selectedLanguage === language.value
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              {language.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LinkModal({ isOpen, onClose, onConfirm, initialUrl = '' }: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onConfirm(url);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-medium text-slate-900 mb-4">插入链接</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-slate-700 mb-1">
                URL
              </label>
              <input
                ref={inputRef}
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600"
              >
                确认
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className={cn(
        "px-4 py-2 rounded-lg shadow-lg flex items-center gap-2",
        type === 'success' ? "bg-green-500 text-white" : "bg-rose-500 text-white"
      )}>
        {type === 'success' ? (
          <CheckIcon className="w-5 h-5" />
        ) : (
          <XCircleIcon className="w-5 h-5" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function EditorToolbar({ 
  editor,
  onImageUpload,
  onNodeSelect,
  contentStyle,
  content,
  theme
}: EditorToolbarProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: ''
  });

  const handleImageInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      await onImageUpload(e.target.files[0]);
    }
  };

  const handleLinkClick = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    setShowLinkModal(true);
  }, [editor]);

  const handleLinkConfirm = useCallback((url: string) => {
    // 如果没有选中文本，使用 URL 作为链接文本
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(url)
        .setTextSelection(editor.state.selection.from)
        .setLink({ href: url })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setLink({ href: url })
        .run();
    }
  }, [editor]);

  const handleCopyRichText = async () => {
    if (isCopying) return;
    
    try {
      setIsCopying(true);
      // 创建一个临时容器来处理富文本内容
      const container = document.createElement('section');
      container.className = 'ProseMirror';
      console.log('theme', theme);
      const containerCssText = Object.entries(theme || {}).map(
        ([key, value]) => {
          return `${key.replace(/([A-Z])/g, (match: string) => `-${match.toLowerCase()}`)}: "${value}"`
        }
      ).join(';');
      console.log('containerCssText', containerCssText);
      container.style.cssText = "background-color: " + theme.backgroundColor + ";" + containerCssText;
      
      const style = document.createElement('style');
      style.textContent = `* { color: ${theme.color}; }` + (contentStyle || '');

      container.innerHTML = content;
      container.appendChild(style);

      console.log('生成的HTML结构:', container.outerHTML);

      // 使用现代剪贴板 API
      const htmlBlob = new Blob([container.outerHTML], { type: 'text/html' });
      const textBlob = new Blob([container.textContent || ''], { type: 'text/plain' });
      
      console.log('准备写入剪贴板的HTML:', container.outerHTML);
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        })
      ]);
      
      setCopyStatus({
        show: true,
        type: 'success',
        message: '复制成功！'
      });
    } catch (error) {
      console.error('Failed to copy rich text:', error);
      setCopyStatus({
        show: true,
        type: 'error',
        message: error instanceof Error ? error.message : '复制失败，请使用快捷键复制'
      });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1.5 border-r pr-3 mr-3">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="标题1"
          >
            <Heading1 className="w-6 h-6" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="标题2"
          >
            <Heading2 className="w-6 h-6" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="标题3"
          >
            <Heading3 className="w-6 h-6" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1.5 border-r pr-3 mr-3">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="加粗"
          >
            <Bold className="w-6 h-6" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="斜体"
          >
            <Italic className="w-6 h-6" />
          </ToolbarButton>
          <LanguageSelect editor={editor} onNodeSelect={onNodeSelect} />
        </div>

        <div className="flex items-center gap-1.5 border-r pr-3 mr-3">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="无序列表"
          >
            <List className="w-6 h-6" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="有序列表"
          >
            <ListOrdered className="w-6 h-6" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1.5 border-r pr-3 mr-3">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="引用"
          >
            <Quote className="w-6 h-6" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="分割线"
          >
            <Minus className="w-6 h-6" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="cursor-pointer" title="插入图片">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageInput}
            />
            <div className={cn(
              'p-2.5 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}>
              <ImageIcon className="w-6 h-6" />
            </div>
          </label>
          <ToolbarButton
            onClick={handleLinkClick}
            isActive={editor.isActive('link')}
            title="插入链接"
          >
            <LinkIcon className="w-6 h-6" />
          </ToolbarButton>
          <ToolbarButton
            onClick={handleCopyRichText}
            title={isCopying ? '正在复制...' : '复制为富文本'}
            disabled={isCopying}
          >
            <Copy className={cn(
              'w-6 h-6',
              isCopying && 'animate-pulse',
              copyStatus.show && copyStatus.type === 'success' && 'text-green-500'
            )} />
          </ToolbarButton>
        </div>
      </div>

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onConfirm={handleLinkConfirm}
        initialUrl={editor.getAttributes('link').href}
      />

      {copyStatus.show && (
        <Toast
          message={copyStatus.message}
          type={copyStatus.type}
          onClose={() => setCopyStatus(prev => ({ ...prev, show: false }))}
        />
      )}
    </>
  );
} 