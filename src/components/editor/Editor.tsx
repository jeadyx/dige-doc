'use client';

import { useEditor, EditorContent, Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Strike from '@tiptap/extension-strike';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
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
import { convertMarkdownToHTML } from '@/lib/markdown';

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
    const plugin = new Plugin({
      key: new PluginKey('markdownPaste'),
      props: {
        handlePaste: (view, event) => {
          const text = event.clipboardData?.getData('text/plain');
          if (!text) return false;

          // 如果粘贴的内容看起来像 Markdown，转换它
          if (text.match(/[*#\[\]_~`>-]/)) {
            const html = convertMarkdownToHTML(text);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            const parser = DOMParser.fromSchema(view.state.schema);
            const doc = parser.parse(tempDiv);
            
            const tr = view.state.tr.replaceSelectionWith(doc);
            view.dispatch(tr);
            return true;
          }

          return false;
        },
      },
    });

    return [plugin];
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
  onEditorReady?: (editor: TiptapEditor) => void;
}

const defaultTextStyle: TextStyle = {
  color: '',
  backgroundColor: '',
  fontWeight: '',
  fontStyle: '',
  textDecoration: '',
  customCSS: '',
};

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
            style: `width: ${attributes.width}`,
          };
        },
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          if (!attributes.height) {
            return {};
          }
          return {
            height: attributes.height,
            style: `height: ${attributes.height}`,
          };
        },
      },
      align: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-align'),
        renderHTML: attributes => {
          if (!attributes.align || attributes.align === 'left') {
            return {};
          }
          return {
            'data-align': attributes.align,
            style: `display: block; margin: ${attributes.align === 'center' ? '0 auto' : `0 ${attributes.align === 'right' ? '0 0 auto' : 'auto 0 0'}`}`,
          };
        },
      },
    };
  },
});

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
  customEditorStyles: customStyles,
  onEditorReady,
}: EditorProps) {
  const [selectedNode, setSelectedNode] = useState<{
    type: string;
    attrs?: Record<string, any>;
    textContent?: string;
  } | null>(null);

  let editor: ReturnType<typeof useEditor>;

  const updateImageAttributes = useCallback((attrs: Record<string, any>) => {
    if (!editor) return;
    
    const { state } = editor;
    const { from } = state.selection;
    const node = state.doc.nodeAt(from);
    
    if (node && node.type.name === 'image') {
      editor.chain().focus().updateAttributes('image', attrs).run();
    }
  }, [editor]);

  editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
          HTMLAttributes: {
            class: 'bullet-list',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true,
          HTMLAttributes: {
            class: 'ordered-list',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'list-item',
          },
        },
        code: {
          HTMLAttributes: {
            class: 'inline-code',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'language-',
            spellcheck: 'false',
          },
        },
      }),
      CustomImage.configure({
        HTMLAttributes: {
          class: 'max-w-full',
        },
        allowBase64: true,
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
      Strike,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Subscript,
      Superscript,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from } = editor.state.selection;
      const node = editor.state.doc.nodeAt(from);
      
      if (node && node.type.name === 'image') {
        onNodeSelect?.({
          type: 'image',
          attrs: {
            ...node.attrs,
            width: node.attrs.width || '',
            height: node.attrs.height || '',
            align: node.attrs.align || 'left',
          },
        });
      } else {
        onNodeSelect?.(null);
      }

      // 更新文本样式信息
      if (onSelectText && !editor.state.selection.empty) {
        const style = node?.attrs.style || '';
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
      handleKeyDown: (view, event) => {
        // Handle hyphen for bullet list
        if (event.key === '-' && event.shiftKey === false) {
          const { state } = view;
          const { selection } = state;
          const { empty, anchor } = selection;
          
          if (empty && anchor === 1) {
            // Convert "- " at the start of document to bullet list
            setTimeout(() => {
              view.dispatch(view.state.tr.delete(0, 2));
              editor?.commands.toggleBulletList();
            }, 50);
            return true;
          }
          
          const textBefore = state.doc.textBetween(
            Math.max(0, anchor - 2),
            anchor,
            '\n'
          );
          
          if (textBefore === '\n') {
            // Convert "- " at the start of a line to bullet list
            setTimeout(() => {
              const pos = anchor;
              view.dispatch(view.state.tr.delete(pos - 1, pos + 1));
              editor?.commands.toggleBulletList();
            }, 50);
            return true;
          }
        }
        
        // Handle number with dot for ordered list
        if (event.key === '.') {
          const { state } = view;
          const { selection } = state;
          const { empty, anchor } = selection;
          
          const textBefore = state.doc.textBetween(
            Math.max(0, anchor - 2),
            anchor,
            '\n'
          );
          
          if (/^\d$/.test(textBefore)) {
            // Convert "1. " to ordered list
            setTimeout(() => {
              const pos = anchor;
              view.dispatch(view.state.tr.delete(pos - 2, pos + 1));
              editor?.commands.toggleOrderedList();
            }, 50);
            return true;
          }
        }
        
        return false;
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
        color: #4B5563;
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
      color: #6B7280;
      pointer-events: none;
      height: 0;
      width: 100%;
      font-style: italic;
    }

    .ProseMirror p:first-child {
      margin-top: 0;
    }

    .ProseMirror ul {
      list-style-type: disc;
      padding-left: 1.5em;
    }

    .ProseMirror ol {
      list-style-type: decimal;
      padding-left: 1.5em;
    }

    .ProseMirror ul.bullet-list {
      list-style-type: disc;
    }

    .ProseMirror ul.bullet-list ul {
      list-style-type: circle;
    }

    .ProseMirror ul.bullet-list ul ul {
      list-style-type: square;
    }

    .ProseMirror ol.ordered-list {
      list-style-type: decimal;
    }

    .ProseMirror ol.ordered-list ol {
      list-style-type: lower-alpha;
    }

    .ProseMirror ol.ordered-list ol ol {
      list-style-type: lower-roman;
    }

    .ProseMirror li.list-item {
      margin: 0.5em 0;
    }

    .ProseMirror li.list-item p {
      margin: 0;
    }

    .ProseMirror s {
      text-decoration: line-through;
    }

    .ProseMirror code.inline-code {
      background-color: rgba(97, 97, 97, 0.1);
      color: #374151;
      padding: 0.2em 0.4em;
      border-radius: 0.3em;
      font-size: 0.9em;
      font-family: 'SF Mono', Monaco, Menlo, Consolas, 'Ubuntu Mono', monospace;
    }

    .ProseMirror table {
      border-collapse: collapse;
      table-layout: fixed;
      width: 100%;
      margin: 1em 0;
      overflow: hidden;
    }

    .ProseMirror td,
    .ProseMirror th {
      min-width: 1em;
      border: 1px solid #ddd;
      padding: 0.5em 1em;
      vertical-align: top;
      box-sizing: border-box;
      position: relative;
      > * {
        margin-bottom: 0;
      }
    }

    .ProseMirror th {
      font-weight: bold;
      background-color: #f5f5f5;
    }

    .ProseMirror .selectedCell:after {
      z-index: 2;
      position: absolute;
      content: "";
      left: 0; right: 0; top: 0; bottom: 0;
      background: rgba(200, 200, 255, 0.4);
      pointer-events: none;
    }

    .ProseMirror ul[data-type="taskList"] {
      list-style: none;
      padding: 0;
    }

    .ProseMirror ul[data-type="taskList"] li {
      display: flex;
      align-items: flex-start;
      margin: 0.5em 0;
    }

    .ProseMirror ul[data-type="taskList"] li > label {
      margin-right: 0.5em;
      user-select: none;
    }

    .ProseMirror ul[data-type="taskList"] li > div {
      flex: 1;
    }

    .ProseMirror sup {
      vertical-align: super;
      font-size: 0.75em;
    }

    .ProseMirror sub {
      vertical-align: sub;
      font-size: 0.75em;
    }

    .ProseMirror .footnotes-list {
      margin-top: 2em;
      border-top: 1px solid #ddd;
      padding-top: 1em;
    }

    .ProseMirror .footnotes-list p {
      margin: 0;
    }

    .ProseMirror .footnote-backref {
      text-decoration: none;
      margin-left: 0.5em;
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

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

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