'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@/components/editor/Editor';
import DocumentTree from '@/components/layout/DocumentTree';
import { Document, DocumentTree as DocumentTreeType, DocumentStyle } from '@/types/document';
import { PlusIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import RightPanel, { EditorStyle, TextStyle, EditorTheme } from '@/components/layout/RightPanel';
import JSZip from 'jszip';
import { formatDate } from '@/lib/utils';
import AIChat from '@/components/ai/AIChat';
import { AIConfig } from '@/types/ai';
import { Editor as TiptapEditor } from '@tiptap/react';
import { convertMarkdownToHTML } from '@/lib/markdown';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';
import { useSession } from 'next-auth/react';
import PrivacyToggle from '@/components/document/PrivacyToggle';

const THEMES: EditorTheme[] = [
  {
    id: 'light' as const,
    name: '默认',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '16px',
    lineHeight: '1.5',
    paragraphSpacing: '1rem',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    customCSS: '',
  },
  {
    id: 'sepia' as const,
    name: '护眼',
    backgroundColor: '#faf6f1',
    color: '#433422',
    fontSize: '16px',
    lineHeight: '1.5',
    paragraphSpacing: '1rem',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    customCSS: '',
  },
  {
    id: 'dark' as const,
    name: '深色',
    backgroundColor: '#1a1a1a',
    color: '#e5e7eb',
    fontSize: '16px',
    lineHeight: '1.5',
    paragraphSpacing: '1rem',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    customCSS: '',
  }
];

function buildDocumentTree(documents: Document[]): DocumentTreeType[] {
  const documentMap = new Map<string, DocumentTreeType>();
  const rootDocuments: DocumentTreeType[] = [];

  // First pass: Create all document nodes
  documents.forEach(doc => {
    documentMap.set(doc.id, {
      ...doc,
      children: [],
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  });

  // Second pass: Build the tree structure
  documents.forEach(doc => {
    const documentNode = documentMap.get(doc.id)!;
    if (doc.parentId) {
      const parentNode = documentMap.get(doc.parentId);
      if (parentNode) {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(documentNode);
      } else {
        rootDocuments.push(documentNode);
      }
    } else {
      rootDocuments.push(documentNode);
    }
  });

  return rootDocuments;
}

export default function Home() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentCache = useRef<Map<string, string>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [editorStyle, setEditorStyle] = useState<EditorStyle>({
    fontSize: '16px',
    lineHeight: '1.5',
    paragraphSpacing: '1rem',
    theme: 'light',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    customCSS: '',
  });
  const [editorStyleTemplate, setEditorStyleTemplate] = useState<string>('');
  const [selectedTextStyle, setSelectedTextStyle] = useState<TextStyle>({
    color: '',
    backgroundColor: '',
    fontWeight: '',
    fontStyle: '',
    textDecoration: '',
    customCSS: '',
  });
  const [applyTextStyle, setApplyTextStyle] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{
    type: string;
    attrs?: Record<string, any>;
    textContent?: string;
  } | null>(null);
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    provider: 'deepseek',
    apiKey: '',
    temperature: 0.7,
  });
  const [editor, setEditor] = useState<TiptapEditor | null>(null);

  useEffect(() => {
    console.log('editorStyle', editorStyle);
  }, [editorStyle]);

  // 处理从个人中心页面返回时的session刷新
  useEffect(() => {
    // 检查URL中是否有refresh参数
    const urlParams = new URLSearchParams(window.location.search);
    const needRefresh = urlParams.get('refresh');
    
    if (needRefresh === 'true') {
      // 删除URL中的refresh参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // 刷新页面以更新session
      window.location.reload();
    }
    
    fetchDocuments();
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // 当用户登录状态变化时重新获取文档
  useEffect(() => {
    fetchDocuments();
  }, [session]);

  useEffect(() => {
    if (selectedId) {
      const selectedDocument = documents.find(doc => doc.id === selectedId);
      if (selectedDocument) {
        try {
          const defaultStyle: DocumentStyle = {
            editor: {
              fontSize: '16px',
              lineHeight: '1.5',
              paragraphSpacing: '1rem',
              theme: 'light',
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
              customCSS: '',
            },
            text: {
              color: '',
              backgroundColor: '',
              fontWeight: '',
              fontStyle: '',
              textDecoration: '',
              customCSS: '',
            }
          };

          let documentStyle: DocumentStyle;
          try {
            documentStyle = selectedDocument.style ? JSON.parse(selectedDocument.style) as DocumentStyle : defaultStyle;
            if(Object.keys(documentStyle).length === 0){
              documentStyle = defaultStyle;
            }
          } catch (parseError) {
            console.error('Failed to parse document style:', parseError);
            documentStyle = defaultStyle;
          }
          setEditorStyle(documentStyle.editor);
          setSelectedTextStyle(documentStyle.text);
        } catch (error) {
          console.error('Error handling document style:', error);
          // 使用默认样式
          setEditorStyle({
            fontSize: '16px',
            lineHeight: '1.5',
            paragraphSpacing: '1rem',
            theme: 'light',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
            customCSS: '',
          });
          setSelectedTextStyle({
            color: '',
            backgroundColor: '',
            fontWeight: '',
            fontStyle: '',
            textDecoration: '',
            customCSS: '',
          });
        }
      }
    }
  }, [selectedId, documents]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      // Convert date strings to Date objects
      const processedData = data.map((doc: Document) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      }));
      setDocuments(processedData);
      // Initialize content cache
      processedData.forEach((doc: Document) => {
        contentCache.current.set(doc.id, doc.content);
      });
      setError(null);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDocument = async (parentId?: string) => {
    if (!session?.user) {
      alert('请先登录后再创建文档');
      return;
    }
    
    try {
      const defaultStyle: DocumentStyle = {
        editor: {
          fontSize: '16px',
          lineHeight: '1.5',
          paragraphSpacing: '1rem',
          theme: 'light',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
          customCSS: '',
        },
        text: {
          color: '',
          backgroundColor: '',
          fontWeight: '',
          fontStyle: '',
          textDecoration: '',
          customCSS: '',
        }
      };

      // 生成默认文件名：YYYY-MM-DD HH:mm:ss
      const now = new Date();
      const defaultTitle = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-');

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: defaultTitle,
          content: '',
          parentId,
          style: JSON.stringify(defaultStyle),
          userId: session.user.id,
          isPublic: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const newDocument = await response.json();
      // 确保日期字段是 Date 对象
      // 确保日期字段是 Date 对象，并添加作者信息
      const processedDocument = {
        ...newDocument,
        createdAt: new Date(newDocument.createdAt),
        updatedAt: new Date(newDocument.updatedAt),
        authorName: session.user.name || '未知用户', // 添加作者名称
      };
      
      setDocuments(prev => [...prev, processedDocument]);
      contentCache.current.set(processedDocument.id, '');
      setSelectedId(processedDocument.id);
      return processedDocument;
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleUpdateDocumentPrivacy = async (documentId: string, isPublic: boolean) => {
    if (!session?.user) {
      alert('请先登录后再修改文档隐私设置');
      return;
    }

    try {
      // 发送请求到后端更新文档隐私设置
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update document privacy');
      }

      // 更新文档列表中的隐私设置
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId ? { ...doc, isPublic } : doc
        )
      );
    } catch (error) {
      console.error('Failed to update document privacy:', error);
      alert('修改文档隐私设置失败');
    }
  };

  const handleUpdateDocument = async (content: string) => {
    if (!selectedId) return;
    
    // 未登录用户不能更新文档
    if (!session?.user) {
      return;
    }
    
    // 获取当前选中的文档
    const currentDoc = documents.find(doc => doc.id === selectedId);
    
    // 如果文档不属于当前用户，则不能编辑
    if (currentDoc && currentDoc.userId !== session.user.id) {
      return;
    }

    // Update cache immediately
    contentCache.current.set(selectedId, content);

    // Debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const documentStyle: DocumentStyle = {
          editor: editorStyle,
          text: selectedTextStyle
        };

        const response = await fetch(`/api/documents/${selectedId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            style: JSON.stringify(documentStyle)
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update document');
        }
      } catch (error) {
        console.error('Failed to update document:', error);
      }
    }, 1000);
  };

  const handleRenameDocument = async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename document');
      }

      const updatedDoc = await response.json();
      setDocuments(prev =>
        prev.map(doc => (doc.id === id ? updatedDoc : doc))
      );
    } catch (error) {
      console.error('Failed to rename document:', error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('确定要删除这个文档吗？如果是文件夹，其下的所有文档都会被删除。')) {
      return;
    }

    try {
      // 先获取所有子文档ID，以便在前端也能删除它们
      const childIds = await getAllChildDocumentIds(id);
      
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to delete document';
        
        // 显示具体错误原因
        if (response.status === 401) {
          alert('删除失败：您需要先登录才能删除文档。');
        } else if (response.status === 403) {
          alert('删除失败：只有文档拥有者或管理员可以删除文档。');
        } else {
          alert(`删除失败：${errorMessage}`);
        }
        
        return;
      }

      // 从前端状态中删除主文档和所有子文档
      setDocuments(prev => prev.filter(doc => doc.id !== id && !childIds.includes(doc.id)));
      
      // 从缓存中删除主文档和所有子文档
      contentCache.current.delete(id);
      childIds.forEach(childId => contentCache.current.delete(childId));
      
      // 如果当前选中的是被删除的文档或其子文档，清除选择
      if (selectedId === id || childIds.includes(selectedId || '')) {
        setSelectedId(undefined);
      }
      
      // 显示成功提示
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md';
      successMessage.innerHTML = `
        <div class="flex items-center">
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <p>文档删除成功</p>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      // 3秒后自动移除提示
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert(`删除文档时出错：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 递归获取所有子文档ID的辅助函数
  const getAllChildDocumentIds = async (documentId: string): Promise<string[]> => {
    const children = documents.filter(doc => doc.parentId === documentId);
    if (children.length === 0) return [];
    
    const childIds = children.map(child => child.id);
    const descendantIds = await Promise.all(
      childIds.map(id => getAllChildDocumentIds(id))
    );
    
    return [...childIds, ...descendantIds.flat()];
  };

  const handleCreateChild = async (parentId: string) => {
    const newDoc = await handleCreateDocument(parentId);
    if (newDoc) {
      // 自动触发重命名
      const element = document.getElementById(`doc-${newDoc.id}`);
      if (element) {
        element.focus();
      }
    }
  };

  const handleBatchExport = async (ids: string[]) => {
    try {
      const selectedDocs = documents.filter(doc => ids.includes(doc.id));
      const zip = new JSZip();
      const usedNames = new Set<string>();
      
      for (const doc of selectedDocs) {
        let fileName = `${doc.title}.md`;
        let counter = 1;
        
        // 如果文件名已存在，添加数字后缀
        while (usedNames.has(fileName)) {
          fileName = `${doc.title} (${counter}).md`;
          counter++;
        }
        usedNames.add(fileName);

        // 构建 Markdown 内容
        const content = [
          `# ${doc.title}`,
          `\n_创建于 ${formatDate(doc.createdAt)}_`,
          `\n_更新于 ${formatDate(doc.updatedAt)}_`,
          '\n\n---\n',
          doc.content
        ].join('\n');
        
        zip.file(fileName, content);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = '文档导出.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export documents:', error);
    }
  };

  const handleBatchDelete = async (ids: string[]) => {
    try {
      await Promise.all(
        ids.map(id =>
          fetch(`/api/documents/${id}`, {
            method: 'DELETE',
          })
        )
      );
      
      setDocuments(prev => prev.filter(doc => !ids.includes(doc.id)));
      if (selectedId && ids.includes(selectedId)) {
        setSelectedId(undefined);
      }
    } catch (error) {
      console.error('Failed to delete documents:', error);
    }
  };

  const handleMoveDocument = async (id: string, newParentId: string | undefined) => {
    try {
      console.log('Moving document:', {
        documentId: id,
        newParentId: newParentId
      });

      // 如果 newParentId 是 undefined，使用空字符串
      const parentId = newParentId === undefined ? '' : newParentId;

      // 更新文档的 parentId
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move document');
      }

      // 重新获取文档列表以确保所有关系都正确
      await fetchDocuments();
      console.log('Document moved successfully');
    } catch (error) {
      console.error('Failed to move document:', error);
    }
  };

  const handleReorderDocument = async (id: string, parentId: string | undefined, newIndex: number) => {
    try {
      console.log('Reordering document:', {
        id,
        parentId,
        newIndex
      });

      const response = await fetch(`/api/documents/${id}/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: parentId || null,  // 确保传递 null 而不是 undefined
          index: newIndex,
        }),
      });

      console.log('Reorder response:', {
        ok: response.ok,
        status: response.status
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reorder document');
      }

      const result = await response.json();
      console.log('Reorder result:', result);

      await fetchDocuments(); // 重新获取文档列表以获取正确的顺序
      console.log('Documents refetched after reorder');
    } catch (error) {
      console.error('Failed to reorder document:', error);
    }
  };

  // JavaScript/TypeScript 代码运行函数
  const runJavaScript = async (code: string): Promise<string> => {
    try {
      // 创建一个安全的执行环境
      const sandbox = {
        console: {
          log: (...args: any[]) => sandbox.output.push(...args.map(arg => String(arg))),
          error: (...args: any[]) => sandbox.output.push(...args.map(arg => String(arg))),
          warn: (...args: any[]) => sandbox.output.push(...args.map(arg => String(arg))),
        },
        output: [] as string[],
      };

      // 使用 Function 构造器创建一个新的函数作用域
      const fn = new Function('console', code);
      fn.call(null, sandbox.console);

      return sandbox.output.join('\n');
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`执行错误: ${error.message}`);
      }
      throw new Error('执行错误: 未知错误');
    }
  };

  // Python 代码运行函数
  const runPython = async (code: string): Promise<string> => {
    try {
      const response = await fetch('/api/run/python', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('执行失败');
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      return result.output || '(无输出)';
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`执行错误: ${error.message}`);
      }
      throw new Error('执行错误: 未知错误');
    }
  };

  const handleRunCode = async (code: string, language: string) => {
    try {
      let result;
      switch (language) {
        case 'javascript':
        case 'typescript':
          result = await runJavaScript(code);
          break;
        case 'python':
          result = await runPython(code);
          break;
        default:
          throw new Error('暂不支持该语言的在线运行');
      }

      return {
        success: true,
        output: result,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('执行错误: 未知错误');
    }
  };

  const selectedDocument = documents.find(doc => doc.id === selectedId);
  const documentTree = buildDocumentTree(documents);

  const handleAITextInsert = (text: string) => {
    if (selectedId && editor) {
      const html = convertMarkdownToHTML(text);
      editor.chain().focus().insertContent(html).run();
    }
  };

  const handleNodeUpdate = (attrs: Record<string, any>) => {
    if (!editor) return;
    
    if (selectedNode?.type === 'image') {
      editor.chain().focus().updateAttributes('image', attrs).run();
    }
  };

  // 处理Fork文档的函数
  const [showForkSuccess, setShowForkSuccess] = useState(false);
  const forkSuccessTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleForkDocument = async (documentId: string) => {
    if (!session?.user) {
      alert('请先登录后再fork文档');
      return;
    }
    
    try {
      // 发送请求到后端创建fork文档
      const response = await fetch('/api/documents/fork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fork文档失败');
      }

      const forkedDocument = await response.json();
      // 确保日期字段是 Date 对象
      const processedDocument = {
        ...forkedDocument,
        createdAt: new Date(forkedDocument.createdAt),
        updatedAt: new Date(forkedDocument.updatedAt),
      };
      
      // 添加新fork的文档到文档列表
      setDocuments(prev => {
        // 更新原文档的fork计数
        return prev.map(doc => {
          if (doc.id === documentId) {
            return {
              ...doc,
              forkCount: (doc.forkCount || 0) + 1
            };
          }
          return doc;
        }).concat([processedDocument]);
      });
      
      contentCache.current.set(processedDocument.id, processedDocument.content);
      
      // 切换到新fork的文档
      setSelectedId(processedDocument.id);
      
      // 显示成功提示
      setShowForkSuccess(true);
      
      // 清除之前的计时器
      if (forkSuccessTimeoutRef.current) {
        clearTimeout(forkSuccessTimeoutRef.current);
      }
      
      // 3秒后自动隐藏提示
      forkSuccessTimeoutRef.current = setTimeout(() => {
        setShowForkSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to fork document:', error);
      alert(error instanceof Error ? error.message : 'Fork文档失败');
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Fork成功浮动提示 */}
      {showForkSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md animate-fade-in-out">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <p>Fork成功！已创建文档副本。</p>
          </div>
        </div>
      )}
      
      <Navbar 
        selectedDocument={selectedDocument} 
        onUpdateDocumentPrivacy={handleUpdateDocumentPrivacy}
        onForkDocument={handleForkDocument}
      />
      <div className="flex flex-1 bg-slate-100">
        {/* 左侧目录面板 */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-4 border-b border-slate-200 flex-shrink-0">
          <button
            onClick={() => handleCreateDocument()}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-base font-medium text-white ${session?.user ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-400 cursor-not-allowed'} rounded-lg transition-colors`}
            disabled={!session?.user}
            title={!session?.user ? '请先登录后再创建文档' : ''}
          >
            <PlusIcon className="w-5 h-5" />
            新建文档
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-700">
              加载中...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-rose-600">
              {error}
            </div>
          ) : documents.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <DocumentTextIcon className="w-8 h-8 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">欢迎使用文档编辑器</h3>
                    <p className="text-slate-600 max-w-md">
                      选择或创建一个文档开始编辑。您可以点击左侧的"新建文档"按钮，开始您的创作之旅。
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCreateDocument()}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  新建文档
                </button>
              </div>
            </div>
          ) : (
            <DocumentTree
              documents={documentTree}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onCreateChild={handleCreateChild}
              onRename={handleRenameDocument}
              onDelete={handleDeleteDocument}
              onMove={handleMoveDocument}
              onReorder={handleReorderDocument}
            />
          )}
        </div>
        </aside>
        {/* 中间编辑器区域 */}
        <main className="flex-1 flex flex-col bg-white mx-2 my-2 rounded-md shadow-sm">
        {selectedDocument ? (
          <>
            {/* 移除文档标题区域，已移动到顶部 */}
            <Editor
              key={selectedDocument.id}
              content={contentCache.current.get(selectedDocument.id) || selectedDocument.content}
              onChange={handleUpdateDocument}
              onStyleChange={setEditorStyle}
              onSelectText={setSelectedTextStyle}
              selectedTextStyle={selectedTextStyle}
              applyTextStyle={applyTextStyle}
              onTextStyleApplied={() => setApplyTextStyle(false)}
              onNodeSelect={setSelectedNode}
              theme={{
                ...THEMES.find(theme => theme.id === editorStyle.theme) || THEMES[0],
                ...editorStyle
              }}
              customEditorStyles={editorStyle.customCSS}
              onEditorReady={setEditor}
              readOnly={!session?.user || (selectedDocument.userId !== session?.user?.id)}
            />
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">欢迎使用文档编辑器</h3>
                  <p className="text-slate-600 max-w-md">
                    选择或创建一个文档开始编辑。您可以点击"新建文档"按钮，开始您的创作之旅。
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCreateDocument()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                新建文档
              </button>
            </div>
          </div>
        )}
        </main>
        {/* 右侧属性面板 */}
        <aside className="w-80 bg-white border-l border-slate-200 shadow-sm z-10">
        <RightPanel
          selectedDocument={selectedDocument}
          documents={documents}
          onExport={handleBatchExport}
          onDelete={handleBatchDelete}
          currentStyle={editorStyle}
          onUpdateStyle={setEditorStyle}
          selectedTextStyle={selectedTextStyle}
          onUpdateTextStyle={setSelectedTextStyle}
          onApplyTextStyle={() => setApplyTextStyle(true)}
          selectedNode={selectedNode}
          onRunCode={handleRunCode}
          onRename={handleRenameDocument}
          themes={THEMES}
          editorStyleTemplate={editorStyleTemplate}
          onEditorStyleTemplateChange={setEditorStyleTemplate}
          aiConfig={aiConfig}
          onAIConfigChange={setAIConfig}
          onAITextInsert={handleAITextInsert}
          onUpdateNode={handleNodeUpdate}
          editor={editor}
        />
        </aside>
      </div>
    </div>
  );
}
