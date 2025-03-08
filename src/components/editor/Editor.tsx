'use client';

import { useEditor, EditorContent, Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useState, useEffect } from 'react';
import EditorToolbar from './EditorToolbar';
import { cn } from '@/lib/utils';
import { EditorStyle, TextStyle, Theme } from '../layout/RightPanel';
import { Mark, Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView, Decoration, DecorationSet } from 'prosemirror-view';
import { Slice, Fragment, DOMParser, Node as ProseMirrorNode } from 'prosemirror-model';
import Prism from 'prismjs';
// 基础语言包
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-clike';
// 编程语言
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
// Shell 相关
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-shell-session';
// 配置文件
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-nginx';
import 'prismjs/components/prism-regex';

// 创建自定义 Mark 扩展来处理内联样式
const InlineStyle = Mark.create({
  name: 'inlineStyle',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: '*',
        getAttrs: (element: HTMLElement) => {
          const style = element.getAttribute('style');
          return style ? { style } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return ['span', { style: HTMLAttributes.style }, 0];
  },

  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style'),
        renderHTML: (attributes: { style: string }) => {
          if (!attributes.style) {
            return {};
          }
          return { style: attributes.style };
        },
      },
    };
  },
});

// 创建代码高亮扩展
const CodeBlockHighlight = Extension.create({
  name: 'codeBlockHighlight',

  addStorage() {
    return {
      lastUpdate: 0,
      decorations: [],
    };
  },

  addProseMirrorPlugins() {
    const plugin = new Plugin({
      key: new PluginKey('code-block-highlight'),
      props: {
        decorations: (state) => {
          const { doc } = state;
          const decorations: any[] = [];

          doc.descendants((node, pos) => {
            if (node.type.name === 'codeBlock') {
              const language = node.attrs.language;
              if (!language || !Prism.languages[language]) return;

              // 处理代码高亮
              const code = node.textContent;
              const lines = code.split('\n');
              let offset = pos + 1;

              lines.forEach((line, index) => {
                if (Prism.languages[language]) {
                  const tokens = Prism.tokenize(line, Prism.languages[language]);
                  let lineOffset = offset;

                  const processToken = (token: string | Prism.Token) => {
                    if (typeof token === 'string') {
                      lineOffset += token.length;
                      return;
                    }

                    decorations.push(
                      Decoration.inline(lineOffset, lineOffset + token.length, {
                        class: `token ${token.type}`,
                      })
                    );

                    lineOffset += token.length;
                  };

                  tokens.forEach(processToken);
                }

                offset += line.length + 1; // +1 for newline character
              });
            }
          });

          return DecorationSet.create(doc, decorations);
        },
      },
    });

    return [plugin];
  },
});

// 创建 Markdown 粘贴处理插件
const MarkdownPastePlugin = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste: (view, event) => {
            if (!event.clipboardData) return false;
            
            const text = event.clipboardData.getData('text/plain');
            if (!text) return false;

            // 检查是否包含 Markdown 语法
            const hasMarkdown = /[#*_`>[\]()]/.test(text);
            if (!hasMarkdown) return false;

            // 处理 Markdown 语法
            let html = text
              // 处理标题
              .replace(/^(#{1,3})\s+(.+)$/gm, (_, level, content) => {
                const headingLevel = level.length;
                return `<h${headingLevel}>${content}</h${headingLevel}>`;
              })
              // 处理粗体
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/__(.+?)__/g, '<strong>$1</strong>')
              // 处理斜体
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/_(.+?)_/g, '<em>$1</em>')
              // 处理代码块
              .replace(/```(\w+)?\n([\s\S]+?)\n```/g, (_, language, code) => {
                return `<pre><code class="language-${language || 'plaintext'}">${code}</code></pre>`;
              })
              // 处理行内代码
              .replace(/`(.+?)`/g, '<code>$1</code>')
              // 处理引用
              .replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>')
              // 处理无序列表
              .replace(/^[-*+]\s+(.+)$/gm, '<ul><li>$1</li></ul>')
              // 处理有序列表
              .replace(/^\d+\.\s+(.+)$/gm, '<ol><li>$1</li></ol>')
              // 处理水平线
              .replace(/^[-*_]{3,}$/gm, '<hr>')
              // 处理链接
              .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
              // 处理图片
              .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">');

            // 创建一个临时元素来解析 HTML
            const div = document.createElement('div');
            div.innerHTML = html;

            // 使用 ProseMirror 的 DOMParser 来解析 HTML
            const schema = view.state.schema;
            const parser = DOMParser.fromSchema(schema);
            const doc = parser.parse(div);

            // 在光标位置插入处理后的内容
            const { tr } = view.state;
            const slice = new Slice(doc.content, 0, 0);
            tr.replaceSelection(slice);
            view.dispatch(tr);
            
            return true;
          },
        },
      }),
    ];
  },
});

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  onStyleChange?: (style: EditorStyle) => void;
  onSelectText?: (style: TextStyle) => void;
  selectedTextStyle?: TextStyle;
  applyTextStyle?: boolean;
  onTextStyleApplied?: () => void;
  onNodeSelect?: (node: {
    type: string;
    attrs?: Record<string, any>;
    textContent?: string;
  } | null) => void;
  theme: Theme;
  customEditorStyles?: string;
}

const defaultTextStyle: TextStyle = {
  color: '',
  backgroundColor: '',
  fontWeight: '',
  fontStyle: '',
  textDecoration: '',
  customCSS: '',
};

export default function Editor({ 
  content, 
  onChange, 
  readOnly = false,
  onStyleChange,
  onSelectText,
  selectedTextStyle = defaultTextStyle,
  applyTextStyle = false,
  onTextStyleApplied,
  onNodeSelect,
  theme,
  customEditorStyles: customStyles
}: EditorProps) {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'language-',
            spellcheck: 'false',
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder: '点击此处开始编写...',
        emptyEditorClass: 'is-editor-empty',
      }),
      InlineStyle,
      CodeBlockHighlight,
      MarkdownPastePlugin,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      // 更新选中节点信息
      const { $head } = editor.state.selection;
      const node = $head.parent;
      
      if (node.type.name === 'codeBlock') {
        onNodeSelect?.({
          type: node.type.name,
          attrs: node.attrs,
          textContent: node.textContent,
        });
      } else {
        onNodeSelect?.(null);
      }

      // 更新文本样式信息
      if (onSelectText && !editor.state.selection.empty) {
        const style = node.attrs.style || '';
        const styleObj = parseInlineStyle(style);
        onSelectText({
          color: styleObj.color || '',
          backgroundColor: styleObj.backgroundColor || '',
          fontWeight: styleObj.fontWeight || '',
          fontStyle: styleObj.fontStyle || '',
          textDecoration: styleObj.textDecoration || '',
          customCSS: style,
        });
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
      handleDOMEvents: {
        copy: (view, event) => {
          const { state } = view;
          const { empty, content } = state.selection;
          
          if (empty) return false;
          
          // 检查选中内容是否包含代码块
          let hasCodeBlock = false;
          content().content.forEach(node => {
            if (node.type.name === 'codeBlock') {
              hasCodeBlock = true;
            }
          });
          
          if (!hasCodeBlock) return false;
          
          // 创建一个临时容器来存放带有高亮的代码
          const tempDiv = document.createElement('div');
          content().content.forEach(node => {
            if (node.type.name === 'codeBlock') {
              const language = node.attrs.language;
              const code = node.textContent;
              
              if (language && Prism.languages[language]) {
                const highlightedCode = Prism.highlight(
                  code,
                  Prism.languages[language],
                  language
                );
                
                const pre = document.createElement('pre');
                const codeElement = document.createElement('code');
                codeElement.className = `language-${language}`;
                codeElement.innerHTML = highlightedCode;
                pre.appendChild(codeElement);
                tempDiv.appendChild(pre);
              } else {
                // 如果没有指定语言或语言不支持，则使用普通文本
                const pre = document.createElement('pre');
                const codeElement = document.createElement('code');
                codeElement.textContent = code;
                pre.appendChild(codeElement);
                tempDiv.appendChild(pre);
              }
            } else {
              // 非代码块内容保持原样
              const div = document.createElement('div');
              div.innerHTML = node.type.name === 'paragraph' ? node.textContent : '';
              tempDiv.appendChild(div);
            }
          });
          
          // 将高亮后的 HTML 添加到剪贴板
          event.clipboardData?.setData('text/html', tempDiv.innerHTML);
          event.clipboardData?.setData('text/plain', state.doc.textBetween(
            state.selection.from,
            state.selection.to,
            '\n\n'
          ));
          
          event.preventDefault();
          return true;
        },
      },
    },
  });

  // 辅助函数：解析内联样式字符串为对象
  const parseInlineStyle = (style: string) => {
    const styleObj: Record<string, string> = {};
    if (!style) return styleObj;
    
    style.split(';').forEach(item => {
      const [property, value] = item.split(':').map(str => str.trim());
      if (property && value) {
        styleObj[property] = value;
      }
    });
    
    return styleObj;
  };

  // 辅助函数：将样式对象转换为内联样式字符串
  const styleObjectToString = (styleObj: Record<string, string>) => {
    return Object.entries(styleObj)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  };

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const { url } = await response.json();
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  }, [editor]);


  const customEditorStyles = customStyles || `
    .ProseMirror {
      font-size: ${theme.fontSize};
      line-height: ${theme.lineHeight};
      font-family: ${theme.fontFamily};
      word-wrap: break-word;
      word-break: break-word;
      border: 1px solid gray;
      padding: 1rem;
      border-radius: 1rem;
      background-color: ${theme.backgroundColor};
      color: ${theme.color};
      ${theme.customCSS}
    }

    .ProseMirror:focus {
      outline: none;
    }

    .ProseMirror h1 {
      font-size: calc(${theme.fontSize} * 2);
      line-height: 1.2;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid;
      border-color: inherit;
      padding-bottom: 0.5rem;
      border-radius: 0.5rem;
      border-left: 10px solid rgba(221, 131, 13);
      padding-left: 1rem;
    }

    .ProseMirror h2 {
      font-size: calc(${theme.fontSize} * 1.5);
      line-height: 1.3;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 0.5rem;
      padding: 0.5rem;
      border-left: 10px solid rgba(100, 131, 13);
      padding-left: 1rem;
    }

    .ProseMirror h3 {
      font-size: calc(${theme.fontSize} * 1.2);
      line-height: 1.4;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      border-bottom: 2px solid;
      border-color: inherit;
      padding-bottom: 0.5rem;
      border-left: 10px solid rgba(100, 131, 13);
      padding-left: 1rem;
    }

    .ProseMirror p {
      margin-bottom: ${theme.paragraphSpacing};
    }

    .ProseMirror ul,
    .ProseMirror ol {
      padding-left: 1.5rem;
      margin-bottom: ${theme.paragraphSpacing};
    }

    .ProseMirror li {
      margin-bottom: calc(${theme.paragraphSpacing} * 0.5);
    }

    .ProseMirror blockquote {
      border-left: 10px solid rgba(221, 131, 13);
      border-right: 10px solid rgba(221, 131, 13);
      padding: 1.5rem;
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 0.5rem;
    }

    .ProseMirror blockquote p {
      margin-bottom: 0;
    }

    .ProseMirror code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.875em;
      padding: 0.2em 0.4em;
      border-radius: 0.375rem;
      background-color: ${theme.backgroundColor};
      color: inherit;
      border: 1px solid ${theme.color};
    }

    .ProseMirror pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      background-color: ${theme.backgroundColor};
      border: 1px solid ${theme.color};
      padding: 0;
      border-radius: 0.75rem;
      margin: 1.5rem 0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .ProseMirror pre:after {
      content: '';
      position: absolute;
      left: 1rem;
      top: 0.65rem;
      width: 0.75rem;
      height: 0.75rem;
      background-color: #ef4444;
      border-radius: 50%;
      box-shadow: 1.4rem 0 0 #fbbf24, 2.8rem 0 0 #22c55e;
    }

    .ProseMirror pre > code {
      margin-top: 1rem;
      display: block;
      padding: 1rem;
      white-space: pre;
      position: relative;
      font-family: inherit;
      line-height: 1.6;
      font-size: 0.875em;
      counter-reset: line;
      overflow-x: auto;
      border: none;
    }

    .ProseMirror pre > code > p {
      position: relative;
      padding: 0 1rem 0 3.5rem;
      margin: 0;
      min-height: 1.6em;
      line-height: 1.6;
      white-space: pre;
    }

    .ProseMirror pre > code > p:before {
      counter-increment: line;
      content: counter(line);
      position: absolute;
      left: 0;
      top: 0;
      width: 2.5rem;
      text-align: right;
      padding-right: 1rem;
      color: ${theme.color};
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.875em;
      user-select: none;
    }

    .ProseMirror pre > code > p:hover {
      background-color: #ffffff30;
    }

    .ProseMirror pre > code > p:hover:before {
      color: ${theme.color};
    }

    /* 移除之前的代码块装饰器相关样式 */
    .ProseMirror pre .code-block-wrapper,
    .ProseMirror pre .code-block-wrapper::before,
    .ProseMirror pre code > div,
    .ProseMirror pre code > div::before {
      display: none;
    }

    .ProseMirror img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: 1rem 0;
    }

    .ProseMirror hr {
      border: none;
      border-top: 2px solid;
      border-color: inherit;
      margin: 2rem 0;
    }

    .ProseMirror a {
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 2px;
    }

    .ProseMirror a:hover {
      opacity: 0.8;
    }

    /* Prism.js Theme Customization */
    .ProseMirror pre[class*="language-"] {
      margin: 1rem 0;
      padding: 1rem;
      overflow: auto;
    }

    .ProseMirror code[class*="language-"] {
      text-shadow: none;
    }

    /* Light theme */
    .ProseMirror:not(.dark) {
      & .token.comment,
      & .token.prolog,
      & .token.doctype,
      & .token.cdata {
        color: #6e7781;
      }

      & .token.punctuation {
        color: #24292f;
      }

      & .token.property,
      & .token.tag,
      & .token.boolean,
      & .token.number,
      & .token.constant,
      & .token.symbol,
      & .token.deleted {
        color: #116329;
      }

      & .token.selector,
      & .token.attr-name,
      & .token.string,
      & .token.char,
      & .token.builtin,
      & .token.inserted {
        color: #0550ae;
      }

      & .token.operator,
      & .token.entity,
      & .token.url,
      & .language-css .token.string,
      & .style .token.string {
        color: #24292f;
      }

      & .token.atrule,
      & .token.attr-value,
      & .token.keyword {
        color: #cf222e;
      }

      & .token.function {
        color: #8250df;
      }

      & .token.regex,
      & .token.important,
      & .token.variable {
        color: #953800;
      }
    }

    /* Dark theme */
    .ProseMirror.dark {
      & .token.comment,
      & .token.prolog,
      & .token.doctype,
      & .token.cdata {
        color: #8b949e;
      }

      & .token.punctuation {
        color: #c9d1d9;
      }

      & .token.property,
      & .token.tag,
      & .token.boolean,
      & .token.number,
      & .token.constant,
      & .token.symbol,
      & .token.deleted {
        color: #7ee787;
      }

      & .token.selector,
      & .token.attr-name,
      & .token.string,
      & .token.char,
      & .token.builtin,
      & .token.inserted {
        color: #79c0ff;
      }

      & .token.operator,
      & .token.entity,
      & .token.url,
      & .language-css .token.string,
      & .style .token.string {
        color: #c9d1d9;
      }

      & .token.atrule,
      & .token.attr-value,
      & .token.keyword {
        color: #ff7b72;
      }

      & .token.function {
        color: #d2a8ff;
      }

      & .token.regex,
      & .token.important,
      & .token.variable {
        color: #ffa657;
      }
    }

    .ProseMirror p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: #adb5bd;
      pointer-events: none;
      height: 0;
      width: 100%;
      font-style: italic;
    }

    .ProseMirror p:first-child {
      margin-top: 0;
    }
  `;

  // 监听 content 变化，在内容为空时自动聚焦
  useEffect(() => {
    if (editor && content === '<p></p>') {
      editor.commands.focus();
    }
  }, [editor, content]);

  // 监听 applyTextStyle 标志
  useEffect(() => {
    if (!editor || !applyTextStyle) return;

    const styleObj: Record<string, string> = {};
    if (selectedTextStyle.color) styleObj.color = selectedTextStyle.color;
    if (selectedTextStyle.backgroundColor) styleObj.backgroundColor = selectedTextStyle.backgroundColor;
    if (selectedTextStyle.fontWeight) styleObj.fontWeight = selectedTextStyle.fontWeight;
    if (selectedTextStyle.fontStyle) styleObj.fontStyle = selectedTextStyle.fontStyle;
    if (selectedTextStyle.textDecoration) styleObj.textDecoration = selectedTextStyle.textDecoration;
    
    // 处理自定义 CSS
    if (selectedTextStyle.customCSS) {
      const customStyles = parseInlineStyle(selectedTextStyle.customCSS);
      Object.assign(styleObj, customStyles);
    }

    const styleString = styleObjectToString(styleObj);

    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor
        .chain()
        .focus()
        .setMark('inlineStyle', { style: styleString })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setMark('inlineStyle', { style: styleString })
        .run();
    }

    onTextStyleApplied?.();
  }, [editor, selectedTextStyle, applyTextStyle, onTextStyleApplied]);

  // 添加监听器来检查样式更新
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const marks = editor.getAttributes('inlineStyle');
      if (marks.style) {
        console.log('Current inline styles:', marks.style);
      }
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="w-full h-full flex flex-col">
      <style>{customEditorStyles}</style>
      {!readOnly && (
        <div className="flex items-center justify-between border-b bg-white px-4 py-2">
          <EditorToolbar
            editor={editor}
            onImageUpload={handleImageUpload}
            onNodeSelect={onNodeSelect}
            contentStyle={customEditorStyles}
            content={content}
            theme={theme}
          />
        </div>
      )}
      <div className={cn(
        'flex-1 overflow-auto transition-colors m-4 pb-8'
      )}
      >
        <EditorContent 
          editor={editor}
          className={cn(
            'h-full'
          )}
        />
      </div>
    </div>
  );
} 