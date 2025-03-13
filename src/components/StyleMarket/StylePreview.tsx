import { useState } from 'react';
import { StyleCategory, StyleCategoryData } from '@/types/style-market';

export const STYLE_CATEGORIES: Record<StyleCategory, StyleCategoryData> = {
  heading1: {
    title: '一级标题',
    description: '用于页面的主标题',
    styles: [
      {
        name: '简约大气',
        css: `h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1rem;
}`,
        preview: '这是一个一级标题'
      },
      {
        name: '下划线强调',
        css: `h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  border-bottom: 4px solid #4299e1;
  padding-bottom: 0.5rem;
  display: inline-block;
}`,
        preview: '这是一个一级标题'
      }
    ]
  },
  heading2: {
    title: '二级标题',
    description: '用于主要章节的标题',
    styles: [
      {
        name: '左边框',
        css: `h2 {
  font-size: 2rem;
  font-weight: 600;
  color: #2d3748;
  border-left: 4px solid #4299e1;
  padding-left: 1rem;
}`,
        preview: '这是一个二级标题'
      }
    ]
  },
  heading3: {
    title: '三级标题',
    description: '用于小节的标题',
    styles: [
      {
        name: '渐变底色',
        css: `h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  background: linear-gradient(to right, #ebf8ff 0%, transparent 100%);
  padding: 0.5rem 1rem;
}`,
        preview: '这是一个三级标题'
      }
    ]
  },
  blockquote: {
    title: '引用块',
    description: '用于引用或强调内容',
    styles: [
      {
        name: '优雅简约',
        css: `blockquote {
  border-left: 4px solid #4299e1;
  background-color: #ebf8ff;
  padding: 1rem;
  margin: 1rem 0;
  color: #2d3748;
}`,
        preview: '这是一段引用文本，展示了引用块的样式效果。'
      }
    ]
  },
  codeBlock: {
    title: '代码块',
    description: '用于展示代码',
    styles: [
      {
        name: '暗色主题',
        css: `pre {
  background-color: #2d3748;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}`,
        preview: 'function example() {\n  return "Hello World";\n}'
      }
    ]
  },
  paragraph: {
    title: '段落',
    description: '正文段落样式',
    styles: [
      {
        name: '舒适阅读',
        css: `p {
  line-height: 1.8;
  color: #4a5568;
  margin-bottom: 1.5rem;
}`,
        preview: '这是一段示例文本，展示了段落的样式效果。文本的行高、颜色和间距都经过精心调整，以提供最佳的阅读体验。'
      }
    ]
  },
  link: {
    title: '链接',
    description: '文本链接样式',
    styles: [
      {
        name: '渐变下划线',
        css: `a {
  color: #4299e1;
  text-decoration: none;
  background-image: linear-gradient(#4299e1, #4299e1);
  background-position: 0% 100%;
  background-repeat: no-repeat;
  background-size: 0% 2px;
  transition: background-size .3s;
}
a:hover {
  background-size: 100% 2px;
}`,
        preview: '这是一个示例链接'
      }
    ]
  },
  list: {
    title: '列表',
    description: '有序和无序列表样式',
    styles: [
      {
        name: '现代简约',
        css: `ul {
  list-style: none;
  padding-left: 1.5rem;
}
ul li {
  position: relative;
  margin-bottom: 0.5rem;
}
ul li::before {
  content: "•";
  color: #4299e1;
  font-weight: bold;
  position: absolute;
  left: -1.5rem;
}`,
        preview: '• 第一个列表项\n• 第二个列表项\n• 第三个列表项'
      }
    ]
  }
};

interface StylePreviewProps {
  onAddStyle: (category: StyleCategory, style: string) => void;
  onPreviewStyle: (category: StyleCategory, style: string | null) => void;
}

export default function StylePreview({ onAddStyle, onPreviewStyle }: StylePreviewProps) {
  const [activeCategory, setActiveCategory] = useState<StyleCategory>('heading1');

  function getInlineStyle(category: StyleCategory) {
    return category === 'list' ? 'ul' : category;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(STYLE_CATEGORIES).map(([category, data]) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as StyleCategory)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${activeCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {data.title}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {STYLE_CATEGORIES[activeCategory].styles.map((style, index) => (
          <div 
            key={index} 
            className="border rounded-lg p-6"
            onMouseEnter={() => onPreviewStyle(activeCategory, style.css)}
            onMouseLeave={() => onPreviewStyle(activeCategory, null)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{style.name}</h3>
              </div>
              <button
                onClick={() => onAddStyle(activeCategory, style.css)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                添加到配置箱
              </button>
            </div>

            <div className="rounded-lg p-6">
              <div className="preview-content">
                <style>
                  {`.preview-${activeCategory}-${index} ${style.css}`}
                </style>
                <div className={`preview-${activeCategory}-${index}`}>
                  {activeCategory === 'heading1' && <h1>{style.preview}</h1>}
                  {activeCategory === 'heading2' && <h2>{style.preview}</h2>}
                  {activeCategory === 'heading3' && <h3>{style.preview}</h3>}
                  {activeCategory === 'blockquote' && <blockquote>{style.preview}</blockquote>}
                  {activeCategory === 'paragraph' && <p>{style.preview}</p>}
                  {activeCategory === 'link' && <a href="#">{style.preview}</a>}
                  {activeCategory === 'list' && (
                    <ul>
                      {style.preview.split('\n').map((item, i) => (
                        <li key={i}>{item.substring(2)}</li>
                      ))}
                    </ul>
                  )}
                  {activeCategory === 'codeBlock' && (
                    <pre>{style.preview}</pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 