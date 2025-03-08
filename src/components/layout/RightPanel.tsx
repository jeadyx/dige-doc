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
        style={{ color: 'gray' }}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            style={{ color: 'gray' }}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-8",
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
            style={{ color: 'gray' }}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

type TabType = 'info' | 'batch' | 'style' | 'text' | 'code';

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
  // 添加历史样式状态
  const [styleHistory, setStyleHistory] = useState<Array<{ name: string; style: TextStyle }>>([]);
  const [showSaveStyleDialog, setShowSaveStyleDialog] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  // 添加 CSS 预设状态
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

  return (
    <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full ">
      <div className="flex-none px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              activeTab === 'info'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            信息
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              activeTab === 'text'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            文本样式
          </button>
          {selectedNode?.type === 'codeBlock' && (
            <button
              onClick={() => setActiveTab('code')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                activeTab === 'code'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              代码
            </button>
          )}
          <button
            onClick={() => setActiveTab('batch')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              activeTab === 'batch'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            批量
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && selectedDocument ? (
          <div className="p-4 min-h-full">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1">
                  <InformationCircleIcon className="w-4 h-4" />
                  基本信息
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-slate-500">标题：</span>
                    {isRenaming ? (
                      <form onSubmit={handleRenameSubmit} className="flex-1">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onBlur={handleRenameSubmit}
                          className="w-full px-2 py-1 text-sm bg-white border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          autoFocus
                        />
                      </form>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm text-slate-900">{selectedDocument.title}</span>
                        <button
                          onClick={handleRename}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-slate-500">创建时间：</span>
                    <span className="text-sm text-slate-900">
                      {formatDate(selectedDocument.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-slate-500">更新时间：</span>
                    <span className="text-sm text-slate-900">
                      {formatDate(selectedDocument.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  文档统计
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const stats = selectedDocument.content ? countDocumentStats(selectedDocument.content) : {
                      charCount: 0,
                      chineseCount: 0,
                      wordCount: 0,
                      punctuationCount: 0,
                      readingTimeInMinutes: 0,
                    };
                    return (
                      <>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <HashtagIcon className="w-4 h-4" />
                            字符数
                          </span>
                          <span className="text-sm text-slate-900">{stats.charCount}</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm text-slate-500">中文字数</span>
                          <span className="text-sm text-slate-900">{stats.chineseCount}</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm text-slate-500">英文单词</span>
                          <span className="text-sm text-slate-900">{stats.wordCount}</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm text-slate-500">标点符号</span>
                          <span className="text-sm text-slate-900">{stats.punctuationCount}</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            预计阅读
                          </span>
                          <span className="text-sm text-slate-900">{stats.readingTimeInMinutes} 分钟</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1">
                    <SwatchIcon className="w-4 h-4" />
                    主题
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {themes.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => handleStyleChange('theme', theme.id)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all border shadow-sm',
                          currentStyle.theme === theme.id
                            ? 'ring-2 ring-indigo-500 ring-offset-2'
                            : 'hover:ring-2 hover:ring-slate-200 hover:shadow-md'
                        )}
                        style={{
                          backgroundColor: theme.backgroundColor,
                          color: theme.color,
                          borderColor: theme.id === 'light' ? '#e5e7eb' : 'transparent',
                        }}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1">
                    <Cog6ToothIcon className="w-4 h-4" />
                    基础样式
                  </h4>
                  <div className="space-y-3">
                    <StyleInput
                      label="字号"
                      value={currentStyle.fontSize}
                      onChange={(value) => handleStyleChange('fontSize', value)}
                      placeholder="例如：16px, 1.2rem"
                    />
                    <StyleInput
                      label="行高"
                      value={currentStyle.lineHeight}
                      onChange={(value) => handleStyleChange('lineHeight', value)}
                      placeholder="例如：1.5, 24px"
                    />
                    <StyleInput
                      label="段间距"
                      value={currentStyle.paragraphSpacing}
                      onChange={(value) => handleStyleChange('paragraphSpacing', value)}
                      placeholder="例如：1rem, 16px"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <CodeBracketIcon className="w-4 h-4" />
                      自定义 CSS
                    </h4>
                    <button
                      onClick={() => setShowCustomCSS(!showCustomCSS)}
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      {showCustomCSS ? '收起' : '展开'}
                    </button>
                  </div>
                  {showCustomCSS && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedPreset}
                          onChange={(e) => {
                            const preset = CSS_PRESETS[e.target.value as keyof typeof CSS_PRESETS];
                            if (preset) {
                              setSelectedPreset(e.target.value);
                              if (currentStyle && onUpdateStyle) {
                                onUpdateStyle({
                                  ...currentStyle,
                                  customCSS: preset.css,
                                });
                              }
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">选择预设样式</option>
                          {Object.entries(CSS_PRESETS).map(([key, preset]) => (
                            <option key={key} value={key}>
                              {preset.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            if (currentStyle?.customCSS && onUpdateStyle) {
                              navigator.clipboard.writeText(currentStyle.customCSS);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded"
                          title="复制 CSS"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        value={currentStyle?.customCSS || ''}
                        onChange={(e) => onUpdateStyle?.({
                          ...currentStyle!,
                          customCSS: e.target.value,
                        })}
                        placeholder="输入自定义 CSS 样式，例如：
text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
background: linear-gradient(45deg, #f3f4f6, #e5e7eb);"
                        className="w-full h-32 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                      />
                      {cssErrors.customCSS && (
                        <p className="text-xs text-rose-500 flex items-center gap-1">
                          <ExclamationCircleIcon className="w-4 h-4" />
                          {cssErrors.customCSS}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <CodeBracketIcon className="w-4 h-4" />
                      编辑器样式模板
                    </h4>
                    <button
                      onClick={() => setShowEditorStyleTemplate(!showEditorStyleTemplate)}
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      {showEditorStyleTemplate ? '收起' : '展开'}
                    </button>
                  </div>
                  {showEditorStyleTemplate && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (editor) {
                              const defaultStyles = `
    .ProseMirror {
      font-size: ${currentTheme.fontSize};
      line-height: ${currentTheme.lineHeight};
      font-family: ${currentTheme.fontFamily};
      word-wrap: break-word;
      word-break: break-word;
      border: 1px solid gray;
      padding: 1rem;
      border-radius: 1rem;
      background-color: ${currentTheme.backgroundColor};
      color: ${currentTheme.color};
      ${currentTheme.customCSS}
    }

    .ProseMirror:focus {
      outline: none;
    }

    .ProseMirror h1 {
      font-size: calc(${currentTheme.fontSize} * 2);
      line-height: 1.2;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid;
      border-color: inherit;
      padding-bottom: 0.5rem;
    }

    .ProseMirror h2 {
      font-size: calc(${currentTheme.fontSize} * 1.5);
      line-height: 1.3;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
    }

    .ProseMirror h3 {
      font-size: calc(${currentTheme.fontSize} * 1.2);
      line-height: 1.4;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }`;
                              onEditorStyleTemplateChange(defaultStyles);
                            }
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          重置为默认
                        </button>
                        <button
                          onClick={() => {
                            if (editorStyleTemplate) {
                              navigator.clipboard.writeText(editorStyleTemplate);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded"
                          title="复制样式模板"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        value={editorStyleTemplate}
                        onChange={(e) => {
                          const newTemplate = e.target.value;
                          onEditorStyleTemplateChange(newTemplate);
                          if (editor) {
                            const styleElement = document.createElement('style');
                            styleElement.textContent = newTemplate;
                            document.head.appendChild(styleElement);
                            return () => {
                              document.head.removeChild(styleElement);
                            };
                          }
                        }}
                        placeholder="自定义编辑器样式模板..."
                        className="w-full h-96 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  最近更新
                </h4>
                <div className="space-y-2">
                  {documents.slice(0, 5).map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-slate-700 truncate flex-1">
                        {doc.title}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(doc.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'text' ? (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1">
                  <PaintBrushIcon className="w-4 h-4" />
                  文本样式
                </h4>
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div
                    style={{
                      ...(draftTextStyle.customCSS ? (() => {
                        const div = document.createElement('div');
                        div.style.cssText = draftTextStyle.customCSS;
                        const computedStyles = {
                          ...draftTextStyle.color && { color: draftTextStyle.color },
                          ...draftTextStyle.backgroundColor && { backgroundColor: draftTextStyle.backgroundColor },
                          ...draftTextStyle.fontWeight && { fontWeight: draftTextStyle.fontWeight },
                          ...draftTextStyle.fontStyle && { fontStyle: draftTextStyle.fontStyle },
                          ...draftTextStyle.textDecoration && { textDecoration: draftTextStyle.textDecoration },
                          ...Object.fromEntries(
                            Array.from(div.style).map(prop => [prop, div.style.getPropertyValue(prop)])
                          )
                        };
                        return computedStyles;
                      })() : {
                        color: draftTextStyle.color || undefined,
                        backgroundColor: draftTextStyle.backgroundColor || undefined,
                        fontWeight: draftTextStyle.fontWeight || undefined,
                        fontStyle: draftTextStyle.fontStyle || undefined,
                        textDecoration: draftTextStyle.textDecoration || undefined,
                      })
                    }}
                    className="text-base"
                  >
                    这是一段预览文本，展示所有样式效果。
                  </div>
                </div>
                <div className="space-y-4">
                  {/* 添加历史样式部分 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-slate-600">历史样式</label>
                      <button
                        onClick={() => setShowSaveStyleDialog(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        保存当前样式
                      </button>
                    </div>
                    <div className="space-y-2">
                      {styleHistory.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors"
                        >
                          <span className="text-sm text-slate-700">{item.name}</span>
                          <button
                            onClick={() => handleApplyHistoryStyle(item.style)}
                            className="text-xs text-indigo-600 hover:text-indigo-700"
                          >
                            应用
                          </button>
                        </div>
                      ))}
                      {styleHistory.length === 0 && (
                        <div className="text-sm text-slate-500 text-center py-2">
                          暂无保存的样式
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 保存样式对话框 */}
                  {showSaveStyleDialog && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                        <h3 className="text-lg font-medium text-slate-900 mb-4">保存样式</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              样式名称
                            </label>
                            <input
                              style={{ color: 'gray' }}
                              type="text"
                              value={newStyleName}
                              onChange={(e) => setNewStyleName(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="输入样式名称"
                              autoFocus
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowSaveStyleDialog(false)}
                              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                              取消
                            </button>
                            <button
                              onClick={handleSaveStyle}
                              disabled={!newStyleName.trim()}
                              className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <ColorPicker
                    label="文字颜色"
                    value={draftTextStyle.color}
                    onChange={(value) => handleTextStyleChange('color', value)}
                    placeholder="#000000"
                  />
                  <ColorPicker
                    label="背景颜色"
                    value={draftTextStyle.backgroundColor}
                    onChange={(value) => handleTextStyleChange('backgroundColor', value)}
                    placeholder="#ffffff"
                  />
                  <StyleInputWithPreview
                    label="字重"
                    value={draftTextStyle.fontWeight}
                    onChange={(value) => handleTextStyleChange('fontWeight', value)}
                    placeholder="normal, bold, 600"
                    isValid={!draftTextStyle.fontWeight || !cssErrors.fontWeight}
                    errorMessage={cssErrors.fontWeight}
                  />
                  <StyleInputWithPreview
                    label="字体样式"
                    value={draftTextStyle.fontStyle}
                    onChange={(value) => handleTextStyleChange('fontStyle', value)}
                    placeholder="normal, italic"
                    isValid={!draftTextStyle.fontStyle || !cssErrors.fontStyle}
                    errorMessage={cssErrors.fontStyle}
                  />
                  <StyleInputWithPreview
                    label="文本装饰"
                    value={draftTextStyle.textDecoration}
                    onChange={(value) => handleTextStyleChange('textDecoration', value)}
                    placeholder="underline, line-through"
                    isValid={!draftTextStyle.textDecoration || !cssErrors.textDecoration}
                    errorMessage={cssErrors.textDecoration}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-slate-600">自定义 CSS</label>
                      <button
                        onClick={() => setShowCustomCSS(!showCustomCSS)}
                        className="text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        {showCustomCSS ? '收起' : '展开'}
                      </button>
                    </div>
                    {showCustomCSS && (
                      <div className="space-y-2">
                        <textarea
                          style={{ color: 'gray' }}
                          value={draftTextStyle.customCSS}
                          onChange={(e) => handleTextStyleChange('customCSS', e.target.value)}
                          placeholder="输入自定义 CSS 样式，例如：
text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
letter-spacing: 0.05em;
text-transform: uppercase;"
                          className={cn(
                            "w-full h-32 px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono",
                            cssErrors.customCSS ? "border-rose-300" : "border-slate-200"
                          )}
                        />
                        {cssErrors.customCSS && (
                          <p className="text-xs text-rose-500">{cssErrors.customCSS}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleApplyStyles}
                      disabled={Object.values(cssErrors).some(error => error)}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                        Object.values(cssErrors).some(error => error)
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-indigo-500 text-white hover:bg-indigo-600"
                      )}
                    >
                      <CheckIcon className="w-4 h-4" />
                      应用样式
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'code' && selectedNode?.type === 'codeBlock' ? (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <div className="flex flex-row justify-between items-center mb-3">
                  <h4 className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <CodeBracketIcon className="w-4 h-4" />
                    代码块
                  </h4>
                  {selectedNode.attrs?.language && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded">
                        {LANGUAGE_GROUPS.flatMap(g => g.languages).find(l => l.value === selectedNode.attrs?.language)?.icon}
                        <span>
                          {LANGUAGE_GROUPS.flatMap(g => g.languages).find(l => l.value === selectedNode.attrs?.language)?.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning || !selectedNode.attrs?.language}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                        isRunning
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : selectedNode.attrs?.language
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      )}
                    >
                      {isRunning ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 6v6l4 2"></path>
                          </svg>
                          运行中...
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-4 h-4" />
                          运行代码
                        </>
                      )}
                    </button>
                  </div>

                  {runResult && (
                    <div className={cn(
                      'p-3 rounded-lg text-sm font-mono',
                      runResult.success
                        ? 'bg-green-50 text-green-900'
                        : 'bg-rose-50 text-rose-900'
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        {runResult.success ? (
                          <CheckIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <ExclamationCircleIcon className="w-4 h-4 text-rose-500" />
                        )}
                        <span className="font-medium">
                          {runResult.success ? '运行成功' : '运行失败'}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap break-all mt-2 text-xs leading-5">
                        {runResult.output.split('\n').map((line, index) => {
                          const match = line.match(/^.*?Error.*?:.*?line (\d+)/i);
                          if (match) {
                            const lineNumber = parseInt(match[1]);
                            return (
                              <div key={index} className="error-line text-rose-700">
                                {line}
                                <button
                                  onClick={() => {
                                    if (editor) {
                                      const pos = editor.state.doc.resolve(
                                        editor.state.selection.from
                                      );
                                      const start = pos.start();
                                      const lines = editor.state.doc.textBetween(
                                        start,
                                        pos.end()
                                      ).split('\n');
                                      if (lineNumber <= lines.length) {
                                        let offset = start;
                                        for (let i = 0; i < lineNumber - 1; i++) {
                                          offset += lines[i].length + 1;
                                        }
                                        editor.commands.setTextSelection(offset);
                                      }
                                    }
                                  }}
                                  className="ml-2 text-xs text-rose-600 hover:text-rose-700 underline"
                                >
                                  跳转到第 {lineNumber} 行
                                </button>
                              </div>
                            );
                          }
                          return <div key={index}>{line}</div>;
                        })}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  批量操作
                </h4>
                <button
                  onClick={() => setShowBatchOperations(!showBatchOperations)}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  {showBatchOperations ? '取消' : '开始'}
                </button>
              </div>

              {showBatchOperations && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      {selectedIds.length === documents.length ? '取消全选' : '全选'}
                    </button>
                    <span className="text-xs text-slate-500">
                      已选择 {selectedIds.length} 项
                    </span>
                  </div>

                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2 py-1"
                      >
                        <button
                          onClick={() => handleToggleSelect(doc.id)}
                          className={cn(
                            'w-4 h-4 rounded border transition-colors',
                            selectedIds.includes(doc.id)
                              ? 'bg-indigo-500 border-indigo-500 text-white'
                              : 'border-slate-300 hover:border-indigo-500'
                          )}
                        >
                          {selectedIds.includes(doc.id) && (
                            <CheckCircleIcon className="w-4 h-4" />
                          )}
                        </button>
                        <span className="text-sm text-slate-700 truncate flex-1">
                          {doc.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleExport}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        导出
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('确定要删除选中的文档吗？此操作不可恢复。')) {
                            onDelete(selectedIds);
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                        删除
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 