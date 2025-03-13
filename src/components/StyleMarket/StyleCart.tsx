import { useState } from 'react';
import { StyleCategory } from '@/types/style-market';
import { STYLE_CATEGORIES } from './StylePreview';

interface PreviewState {
  category: StyleCategory | null;
  style: string | null;
}

interface StyleCartProps {
  selectedStyles: Record<StyleCategory, string[]>;
  onRemoveStyle: (category: StyleCategory, style: string) => void;
  previewState: PreviewState;
}

export default function StyleCart({ selectedStyles, onRemoveStyle, previewState }: StyleCartProps) {
  const [isStylesExpanded, setIsStylesExpanded] = useState(false);
  const [previewContent, setPreviewContent] = useState(`
# Markdown 样式预览

## 文档标题展示

### 章节标题示例

这是一个段落示例文本。这段文字展示了基本的段落样式效果。你可以看到文本的行高、颜色和间距是如何呈现的。这里添加了更多的文字，以便你能更好地感受段落的整体效果。

> 这是一个引用块示例。引用块通常用于突出显示重要的文字内容。它可以帮助读者快速定位关键信息，使文档层次分明。

下面是一个列表示例：

- 第一个列表项：展示基本的列表样式
- 第二个列表项：演示列表项之间的间距
- 第三个列表项：体现列表的整体效果

这里有一个[链接](#)示例，你可以看到它的样式效果。

下面是一个代码块示例：

\`\`\`
function styleExample() {
  return "这是一个代码块示例";
}
\`\`\`
  `.trim());

  const selectedStylesCount = Object.values(selectedStyles)
    .reduce((sum, styles) => sum + styles.length, 0);

  const combinedCSS = Object.entries(selectedStyles)
    .flatMap(([_, styles]) => styles)
    .join('\n\n');

  const copyToClipboard = () => {
    console.log('combinedCSS', combinedCSS);
    navigator.clipboard.writeText(combinedCSS);
  };

  // 计算当前应该使用的 CSS
  const currentCSS = (() => {
    if (previewState.style) {
      // 如果有预览样式，使用预览样式和其他分类的已选样式
      return Object.entries(selectedStyles)
        .flatMap(([category, styles]) => {
          if (category === previewState.category) {
            return ["#real-preview " + previewState.style];
          }
          return styles;
        })
        .join('\n\n');
    }
    // 否则使用所有已选样式
    return Object.values(selectedStyles)
      .flat()
      .join('\n\n');
  })();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">样式配置箱</h2>
        <button
          onClick={copyToClipboard}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          复制 CSS
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setIsStylesExpanded(!isStylesExpanded)}
          className="w-full flex justify-between items-center text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div>
            <h3 className="text-lg font-medium">已选择的样式</h3>
            <p className="text-sm text-gray-600">已选择 {selectedStylesCount} 个样式</p>
          </div>
          <svg
            className={`w-5 h-5 transform transition-transform ${isStylesExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isStylesExpanded && (
          <div className="space-y-4 mt-4">
            {Object.entries(selectedStyles).map(([category, styles]) => {
              const categoryData = STYLE_CATEGORIES[category as StyleCategory];
              const styleNames = styles.map(css => 
                categoryData.styles.find(s => s.css === css)?.name || '未命名样式'
              );
              
              return styles.length > 0 && (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3">
                    <h4 className="font-medium text-gray-700">{categoryData.title}</h4>
                  </div>
                  <div className="divide-y">
                    {styleNames.map((name, index) => (
                      <div key={index} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 mr-4">
                            <style>{styles[index]}</style>
                            {category === 'heading1' && <h1>{name}</h1>}
                            {category === 'heading2' && <h2>{name}</h2>}
                            {category === 'heading3' && <h3>{name}</h3>}
                            {category === 'blockquote' && <blockquote>{name}</blockquote>}
                            {category === 'paragraph' && <p>{name}</p>}
                            {category === 'link' && <a href="#">{name}</a>}
                            {category === 'list' && (
                              <ul>
                                <li>{name}</li>
                              </ul>
                            )}
                            {category === 'codeBlock' && <pre>{name}</pre>}
                          </div>
                          <button
                            onClick={() => onRemoveStyle(category as StyleCategory, styles[index])}
                            className="text-red-500 hover:text-red-600 flex-shrink-0"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">实时预览</h3>
        <div className="border rounded-lg p-4" id="real-preview">
          <style>{currentCSS}</style>
          <div className="prose max-w-none space-y-6">
            {previewContent.split('\n\n').map((block, index) => {
              if (block.startsWith('# ')) {
                return <h1 key={index} className="mb-8">{block.slice(2)}</h1>;
              } else if (block.startsWith('## ')) {
                return <h2 key={index} className="mt-8 mb-6">{block.slice(3)}</h2>;
              } else if (block.startsWith('### ')) {
                return <h3 key={index} className="mt-6 mb-4">{block.slice(4)}</h3>;
              } else if (block.startsWith('> ')) {
                return <blockquote key={index} className="my-6">{block.slice(2)}</blockquote>;
              } else if (block.startsWith('- ')) {
                return (
                  <ul key={index} className="my-4">
                    {block.split('\n').map((item, i) => (
                      <li key={i}>{item.slice(2)}</li>
                    ))}
                  </ul>
                );
              } else if (block.startsWith('```')) {
                const code = block.split('\n').slice(1, -1).join('\n');
                return <pre key={index} className="my-6">{code}</pre>;
              } else if (block.includes('[')) {
                return (
                  <p key={index} className="my-4">
                    {block.split(/(\[.*?\]\(.*?\))/).map((part, i) => {
                      if (part.startsWith('[')) {
                        const [text, url] = part.slice(1, -1).split('](');
                        return <a key={i} href={url}>{text}</a>;
                      }
                      return part;
                    })}
                  </p>
                );
              } else {
                return <p key={index} className="my-4">{block}</p>;
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 