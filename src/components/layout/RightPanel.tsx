import { useState, useRef, useEffect } from 'react';
import { DocumentTree } from '@/types/document';
import { formatDate, cn } from '@/lib/utils';
import {
  InformationCircleIcon,
  ClockIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  SwatchIcon,
  PaintBrushIcon,
  CodeBracketIcon,
  CheckIcon,
  ExclamationCircleIcon,
  PlayIcon,
  ChevronDownIcon as ChevronDown,
  XMarkIcon,
  PencilIcon,
  DocumentTextIcon,
  HashtagIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { AIConfig } from '@/types/ai';
import AIChat from '@/components/ai/AIChat';
import ImageSettings from '../editor/ImageSettings';

interface RightPanelProps {
  selectedDocument?: DocumentTree;
  documents: DocumentTree[];
  onExport: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onUpdateStyle?: (style: EditorStyle) => void;
  currentStyle?: EditorStyle;
  selectedTextStyle?: TextStyle;
  onUpdateTextStyle?: (style: TextStyle) => void;
  onApplyTextStyle?: () => void;
  selectedNode: {
    type: string;
    attrs?: Record<string, any>;
    textContent?: string;
  } | null;
  onRunCode: (code: string, language: string) => Promise<{ success: boolean; output: string }>;
  onRename?: (id: string, newTitle: string) => void;
  editor?: any;
  themes: Theme[];
  editorStyleTemplate: string;
  onEditorStyleTemplateChange: (template: string) => void;
  aiConfig: AIConfig;
  onAIConfigChange: (config: AIConfig) => void;
  onAITextInsert: (text: string) => void;
  onUpdateNode?: (attrs: Record<string, any>) => void;
}

export interface EditorStyle {
  fontSize: string;
  lineHeight: string;
  paragraphSpacing: string;
  theme: 'light' | 'sepia' | 'dark';
  fontFamily: string;
  customCSS: string;
}

export interface TextStyle {
  color: string;
  backgroundColor: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  customCSS: string;
}

export interface Theme {
  id: 'light' | 'sepia' | 'dark';
  name: string;
  backgroundColor: string;
  color: string;
  fontSize: string;
  lineHeight: string;
  paragraphSpacing: string;
  fontFamily: string;
  customCSS: string;
}

interface StyleInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function StyleInput({ label, value, onChange, placeholder }: StyleInputProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-600 w-20 flex-shrink-0">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-2 py-1 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}

interface StyleInputWithPreviewProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  previewStyle?: React.CSSProperties;
  isValid?: boolean;
  errorMessage?: string;
}

function StyleInputWithPreview({ 
  label, 
  value, 
  onChange, 
  placeholder,
  previewStyle,
  isValid,
  errorMessage,
}: StyleInputWithPreviewProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600 w-20 flex-shrink-0">
          {label}
        </label>
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full px-2 py-1 text-sm text-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-8",
              isValid === false ? "border-rose-300" : "border-slate-200"
            )}
          />
          {isValid === false && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500">
              <ExclamationCircleIcon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
      {errorMessage && isValid === false && (
        <p className="text-xs text-rose-500 ml-[5.5rem]">{errorMessage}</p>
      )}
      {value && previewStyle && (
        <div className="ml-[5.5rem] p-2 bg-slate-50 rounded-lg">
          <div style={previewStyle} className="text-sm">
            预览文本
          </div>
        </div>
      )}
    </div>
  );
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function ColorPicker({ label, value, onChange, placeholder }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-600 w-20 flex-shrink-0">
        {label}
      </label>
      <div className="flex-1 relative">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-2 py-1 text-sm text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-6 h-6 rounded border border-slate-200 shadow-sm flex-shrink-0"
            style={{ backgroundColor: value || 'white' }}
          />
        </div>
        {showPicker && (
          <div
            ref={pickerRef}
            className="absolute right-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
            style={{ width: '240px' }}
          >
            <div className="grid grid-cols-8 gap-1">
              {[
                '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff',
                '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff',
                '#9900ff', '#ff00ff', '#ff66cc', '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3',
                '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc', '#ea9999', '#f9cb9c', '#ffe599',
                '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd'
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onChange(color);
                    setShowPicker(false);
                  }}
                  className="w-6 h-6 rounded border border-slate-200"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type TabType = 'info' | 'batch' | 'style' | 'text' | 'code' | 'ai';

const LANGUAGE_GROUPS = [
  {
    name: '常用语言',
    languages: [
      { value: 'javascript', label: 'JavaScript', icon: '⚡️' },
      { value: 'typescript', label: 'TypeScript', icon: '💪' },
      { value: 'python', label: 'Python', icon: '🐍' },
      { value: 'java', label: 'Java', icon: '☕️' },
      { value: 'cpp', label: 'C++', icon: '⚙️' },
    ]
  },
  {
    name: '前端开发',
    languages: [
      { value: 'jsx', label: 'JSX', icon: '⚛️' },
      { value: 'tsx', label: 'TSX', icon: '⚛️' },
      { value: 'css', label: 'CSS', icon: '🎨' },
      { value: 'html', label: 'HTML', icon: '📄' },
    ]
  },
  {
    name: '后端开发',
    languages: [
      { value: 'go', label: 'Go', icon: '🐹' },
      { value: 'rust', label: 'Rust', icon: '🦀' },
      { value: 'ruby', label: 'Ruby', icon: '💎' },
      { value: 'php', label: 'PHP', icon: '🐘' },
      { value: 'csharp', label: 'C#', icon: '🎯' },
    ]
  },
  {
    name: '数据 & 配置',
    languages: [
      { value: 'json', label: 'JSON', icon: '📦' },
      { value: 'yaml', label: 'YAML', icon: '📝' },
      { value: 'sql', label: 'SQL', icon: '🗃️' },
      { value: 'markdown', label: 'Markdown', icon: '📑' },
    ]
  },
  {
    name: '系统 & 工具',
    languages: [
      { value: 'bash', label: 'Bash', icon: '💻' },
      { value: 'shell', label: 'Shell', icon: '🐚' },
      { value: 'docker', label: 'Docker', icon: '🐳' },
      { value: 'nginx', label: 'Nginx', icon: '🌐' },
    ]
  },
];

// 添加文档统计助手函数
function countDocumentStats(content: string) {
  // 移除 HTML 标签
  const textContent = content.replace(/<[^>]+>/g, '');
  
  // 计算字符数（包括标点和空格）
  const charCount = textContent.length;
  
  // 计算中文字数
  const chineseCount = (textContent.match(/[\u4e00-\u9fa5]/g) || []).length;
  
  // 计算英文单词数
  const wordCount = textContent
    .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文字符
    .split(/\s+/)
    .filter(word => word.length > 0).length;
  
  // 计算标点符号数
  const punctuationCount = (textContent.match(/[.,!?;:'"，。！？；：、]/g) || []).length;
  
  // 估算阅读时间（假设平均阅读速度：中文 300 字/分钟，英文 200 词/分钟）
  const readingTimeInMinutes = Math.ceil((chineseCount / 300) + (wordCount / 200));
  
  return {
    charCount,
    chineseCount,
    wordCount,
    punctuationCount,
    readingTimeInMinutes,
  };
}

// 添加 CSS 预设
const CSS_PRESETS = {
  文本阴影: {
    label: '文本阴影',
    css: 'text-shadow: 2px 2px 4px rgba(0,0,0,0.2);',
  },
  渐变背景: {
    label: '渐变背景',
    css: 'background: linear-gradient(45deg, #f3f4f6, #e5e7eb);',
  },
  圆角边框: {
    label: '圆角边框',
    css: 'border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px;',
  },
  玻璃拟态: {
    label: '玻璃拟态',
    css: 'background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);',
  },
};

export default function RightPanel({
  selectedDocument,
  documents,
  onExport,
  onDelete,
  onUpdateStyle,
  currentStyle = {
    fontSize: '16px',
    lineHeight: '1.5',
    paragraphSpacing: '1rem',
    theme: 'light',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    customCSS: '',
  },
  selectedTextStyle = {
    color: '',
    backgroundColor: '',
    fontWeight: '',
    fontStyle: '',
    textDecoration: '',
    customCSS: '',
  },
  onUpdateTextStyle,
  onApplyTextStyle,
  selectedNode,
  onRunCode,
  onRename,
  editor,
  themes,
  editorStyleTemplate,
  onEditorStyleTemplateChange,
  aiConfig,
  onAIConfigChange,
  onAITextInsert,
  onUpdateNode,
}: RightPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchOperations, setShowBatchOperations] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showCustomCSS, setShowCustomCSS] = useState(false);
  const [draftTextStyle, setDraftTextStyle] = useState(selectedTextStyle);
  const [cssErrors, setCssErrors] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ success: boolean; output: string } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(selectedDocument?.title || '');
  const [styleHistory, setStyleHistory] = useState<Array<{ name: string; style: TextStyle }>>([]);
  const [showSaveStyleDialog, setShowSaveStyleDialog] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showEditorStyleTemplate, setShowEditorStyleTemplate] = useState(false);

  // 获取当前主题
  const currentTheme = themes.find(t => t.id === currentStyle.theme) || themes[0];

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allIds = documents.map(doc => doc.id);
    setSelectedIds(prev => prev.length === allIds.length ? [] : allIds);
  };

  const handleStyleChange = (key: keyof EditorStyle, value: string) => {
    if (onUpdateStyle) {
      const updatedStyle = {
        ...currentStyle,
        [key]: value,
      };
      onUpdateStyle(updatedStyle);
    }
  };

  // CSS validation functions
  const validateColor = (value: string) => {
    if (!value) return true;
    const colorRegex = /^(#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z-]+)$/;
    return colorRegex.test(value);
  };

  const validateFontWeight = (value: string) => {
    if (!value) return true;
    const fontWeightRegex = /^(normal|bold|lighter|bolder|\d{3})$/;
    return fontWeightRegex.test(value);
  };

  const validateFontStyle = (value: string) => {
    if (!value) return true;
    const fontStyleRegex = /^(normal|italic|oblique( -?\d+deg)?)$/;
    return fontStyleRegex.test(value);
  };

  const validateTextDecoration = (value: string) => {
    if (!value) return true;
    const textDecorationRegex = /^(none|underline|overline|line-through)(\s+(solid|double|dotted|dashed|wavy))?(\s+[a-z-]+)?$/;
    return textDecorationRegex.test(value);
  };

  const validateCSS = (value: string) => {
    if (!value) return true;
    try {
      const dummy = document.createElement('div');
      dummy.style.cssText = value;
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleTextStyleChange = (key: keyof TextStyle, value: string) => {
    setDraftTextStyle(prev => ({ ...prev, [key]: value }));
    
    // Validate the input
    let isValid = true;
    let errorMessage = '';
    
    switch (key) {
      case 'color':
      case 'backgroundColor':
        isValid = validateColor(value);
        errorMessage = '无效的颜色值。支持：#RGB, #RGBA, #RRGGBB, #RRGGBBAA, rgb(), rgba(), hsl(), hsla(), 颜色关键字';
        break;
      case 'fontWeight':
        isValid = validateFontWeight(value);
        errorMessage = '无效的字重值。支持：normal, bold, lighter, bolder, 100-900';
        break;
      case 'fontStyle':
        isValid = validateFontStyle(value);
        errorMessage = '无效的字体样式。支持：normal, italic, oblique, oblique 角度';
        break;
      case 'textDecoration':
        isValid = validateTextDecoration(value);
        errorMessage = '无效的文本装饰。支持：none, underline, overline, line-through, 可选样式和颜色';
        break;
      case 'customCSS':
        isValid = validateCSS(value);
        errorMessage = '无效的 CSS 语法';
        break;
    }

    if (!value) {
      setCssErrors(prev => ({ ...prev, [key]: '' }));
    } else if (!isValid) {
      setCssErrors(prev => ({ ...prev, [key]: errorMessage }));
    } else {
      setCssErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleApplyStyles = () => {
    // Check if there are any validation errors
    if (Object.values(cssErrors).some(error => error)) {
      return;
    }
    onUpdateTextStyle?.(draftTextStyle);
    onApplyTextStyle?.();
  };

  useEffect(() => {
    if (selectedNode?.type === 'codeBlock') {
      setActiveTab('code');
    }
  }, [selectedNode]);

  const handleRunCode = async () => {
    if (!selectedNode || selectedNode.type !== 'codeBlock' || !onRunCode) return;
    
    const code = selectedNode.textContent || '';
    const language = selectedNode.attrs?.language || '';

    setIsRunning(true);
    setRunResult(null);

    try {
      const result = await onRunCode(code, language);
      setRunResult(result);
    } catch (error) {
      setRunResult({
        success: false,
        output: error instanceof Error ? error.message : '·失败',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRename = () => {
    setIsRenaming(true);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocument && onRename && newTitle.trim() !== '') {
      onRename(selectedDocument.id, newTitle.trim());
    }
    setIsRenaming(false);
  };

  const handleExport = () => {
    onExport(selectedIds);
  };

  const handleExportHTML = () => {
    const selectedDocuments = documents.filter(doc => selectedIds.includes(doc.id));
    
    // 创建包含所有选中文档的 HTML
    const html = selectedDocuments.map(doc => `
      <div class="document">
        <h1>${doc.title}</h1>
        <div class="content">${doc.content}</div>
      </div>
    `).join('\n');
    
    // 添加基本样式
    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>导出文档</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; }
          .document { margin: 2rem 0; padding: 2rem; border-bottom: 1px solid #eee; }
          .document:last-child { border-bottom: none; }
          h1 { color: #1a1a1a; margin-bottom: 1rem; }
          .content { color: #333; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    // 创建并下载文件
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '导出文档.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveStyle = () => {
    if (newStyleName.trim()) {
      setStyleHistory(prev => [...prev, { name: newStyleName.trim(), style: draftTextStyle }]);
      setNewStyleName('');
      setShowSaveStyleDialog(false);
    }
  };

  const handleApplyHistoryStyle = (style: TextStyle) => {
    setDraftTextStyle(style);
    if (onUpdateTextStyle) {
      onUpdateTextStyle(style);
    }
  };

  const renderImageSettings = () => {
    if (!selectedNode || selectedNode.type !== 'image') return null;

    const attrs = selectedNode.attrs || {};
    
    return (
      <div className="p-4 space-y-4 border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-900">图片设置</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              宽度
            </label>
            <input
              type="text"
              value={attrs.width || ''}
              onChange={(e) => {
                if (onUpdateNode) {
                  onUpdateNode({ ...attrs, width: e.target.value });
                }
              }}
              placeholder="例如：100px 或 50%"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              高度
            </label>
            <input
              type="text"
              value={attrs.height || ''}
              onChange={(e) => {
                if (onUpdateNode) {
                  onUpdateNode({ ...attrs, height: e.target.value });
                }
              }}
              placeholder="例如：100px"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              对齐方式
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateNode?.({ ...attrs, align: 'left' })}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg transition-colors text-center',
                  attrs.align === 'left'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                )}
              >
                左对齐
              </button>
              <button
                onClick={() => onUpdateNode?.({ ...attrs, align: 'center' })}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg transition-colors text-center',
                  attrs.align === 'center'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                )}
              >
                居中
              </button>
              <button
                onClick={() => onUpdateNode?.({ ...attrs, align: 'right' })}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg transition-colors text-center',
                  attrs.align === 'right'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                )}
              >
                右对齐
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full border-l border-slate-200 bg-white overflow-y-auto">
      {selectedNode?.type === 'image' && (
        <ImageSettings
          editor={editor}
          attrs={selectedNode.attrs || {}}
        />
      )}
      <div className="h-full flex flex-col">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('style')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'style'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            编辑器样式
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'text'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            文本样式
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'ai'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            AI 助手
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'style' && (
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-900">主题</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleStyleChange('theme', theme.id)}
                      className={cn(
                        'px-3 py-2 text-sm rounded-lg transition-colors text-center',
                        currentStyle.theme === theme.id
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                      )}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <StyleInput
                  label="字体大小"
                  value={currentStyle.fontSize}
                  onChange={(value) => handleStyleChange('fontSize', value)}
                  placeholder="例如：16px"
                />
                <StyleInput
                  label="行高"
                  value={currentStyle.lineHeight}
                  onChange={(value) => handleStyleChange('lineHeight', value)}
                  placeholder="例如：1.5"
                />
                <StyleInput
                  label="段落间距"
                  value={currentStyle.paragraphSpacing}
                  onChange={(value) => handleStyleChange('paragraphSpacing', value)}
                  placeholder="例如：1rem"
                />
                <StyleInput
                  label="字体"
                  value={currentStyle.fontFamily}
                  onChange={(value) => handleStyleChange('fontFamily', value)}
                  placeholder="输入字体名称"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-900">自定义 CSS</h3>
                  <button
                    onClick={() => setShowCustomCSS(!showCustomCSS)}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    {showCustomCSS ? '收起' : '展开'}
                  </button>
                </div>
                {showCustomCSS && (
                  <textarea
                    value={currentStyle.customCSS}
                    onChange={(e) => handleStyleChange('customCSS', e.target.value)}
                    placeholder="输入自定义 CSS"
                    className="w-full h-32 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <ColorPicker
                  label="文字颜色"
                  value={draftTextStyle.color}
                  onChange={(value) => handleTextStyleChange('color', value)}
                  placeholder="例如：#000000"
                />
                <ColorPicker
                  label="背景颜色"
                  value={draftTextStyle.backgroundColor}
                  onChange={(value) => handleTextStyleChange('backgroundColor', value)}
                  placeholder="例如：#ffffff"
                />
                <StyleInputWithPreview
                  label="字重"
                  value={draftTextStyle.fontWeight}
                  onChange={(value) => handleTextStyleChange('fontWeight', value)}
                  placeholder="例如：bold"
                  previewStyle={{ fontWeight: draftTextStyle.fontWeight || undefined }}
                  isValid={!cssErrors.fontWeight}
                  errorMessage={cssErrors.fontWeight}
                />
                <StyleInputWithPreview
                  label="字体样式"
                  value={draftTextStyle.fontStyle}
                  onChange={(value) => handleTextStyleChange('fontStyle', value)}
                  placeholder="例如：italic"
                  previewStyle={{ fontStyle: draftTextStyle.fontStyle as any || undefined }}
                  isValid={!cssErrors.fontStyle}
                  errorMessage={cssErrors.fontStyle}
                />
                <StyleInputWithPreview
                  label="文本装饰"
                  value={draftTextStyle.textDecoration}
                  onChange={(value) => handleTextStyleChange('textDecoration', value)}
                  placeholder="例如：underline"
                  previewStyle={{ textDecoration: draftTextStyle.textDecoration || undefined }}
                  isValid={!cssErrors.textDecoration}
                  errorMessage={cssErrors.textDecoration}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-900">自定义 CSS</h3>
                  <button
                    onClick={() => setShowCustomCSS(!showCustomCSS)}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    {showCustomCSS ? '收起' : '展开'}
                  </button>
                </div>
                {showCustomCSS && (
                  <div className="space-y-2">
                    <textarea
                      value={draftTextStyle.customCSS}
                      onChange={(e) => handleTextStyleChange('customCSS', e.target.value)}
                      placeholder="输入自定义 CSS"
                      className="w-full h-32 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {cssErrors.customCSS && (
                      <p className="text-xs text-rose-500">{cssErrors.customCSS}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setShowSaveStyleDialog(true)}
                  className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  保存为预设
                </button>
                <button
                  onClick={handleApplyStyles}
                  disabled={Object.values(cssErrors).some(error => error)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    Object.values(cssErrors).some(error => error)
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  )}
                >
                  应用样式
                </button>
              </div>

              {showSaveStyleDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-96">
                    <h3 className="text-lg font-medium text-slate-900 mb-4">保存样式预设</h3>
                    <input
                      type="text"
                      value={newStyleName}
                      onChange={(e) => setNewStyleName(e.target.value)}
                      placeholder="输入预设名称"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowSaveStyleDialog(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSaveStyle}
                        disabled={!newStyleName.trim()}
                        className={cn(
                          'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                          !newStyleName.trim()
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                        )}
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="h-full">
              <AIChat
                config={aiConfig}
                onConfigChange={onAIConfigChange}
                onInsertText={onAITextInsert}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 