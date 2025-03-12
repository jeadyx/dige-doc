'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@/components/editor/Editor';
import DocumentTree from '@/components/layout/DocumentTree';
import { Document, DocumentTree as DocumentTreeType, DocumentStyle } from '@/types/document';
import { PlusIcon } from '@heroicons/react/24/outline';
import RightPanel, { EditorStyle, TextStyle, Theme } from '@/components/layout/RightPanel';
import JSZip from 'jszip';
import { formatDate } from '@/lib/utils';
import AIChat from '@/components/ai/AIChat';
import { AIConfig } from '@/types/ai';
import { Editor as TiptapEditor } from '@tiptap/react';
import { convertMarkdownToHTML } from '@/lib/markdown';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const THEMES: Theme[] = [
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

  useEffect(() => {
    fetchDocuments();
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const newDocument = await response.json();
      // 确保日期字段是 Date 对象
      const processedDocument = {
        ...newDocument,
        createdAt: new Date(newDocument.createdAt),
        updatedAt: new Date(newDocument.updatedAt),
      };
      
      setDocuments(prev => [...prev, processedDocument]);
      contentCache.current.set(processedDocument.id, '');
      setSelectedId(processedDocument.id);
      return processedDocument;
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleUpdateDocument = async (content: string) => {
    if (!selectedId) return;

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
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(prev => prev.filter(doc => doc.id !== id));
      contentCache.current.delete(id);
      if (selectedId === id) {
        setSelectedId(undefined);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
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

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex-shrink-0">
          <button
            onClick={() => handleCreateDocument()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-base font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
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
      <main className="flex-1 flex flex-col bg-slate-50">
        {selectedDocument ? (
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
            customEditorStyles={editorStyleTemplate}
            onEditorReady={setEditor}
          />
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
      <aside className="w-80 bg-white border-l border-slate-200">
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
  );
}
