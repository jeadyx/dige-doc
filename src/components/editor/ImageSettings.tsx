import { cn } from '@/lib/utils';
import { Editor } from '@tiptap/react';

interface ImageSettingsProps {
  editor: Editor | null;
  attrs: Record<string, any>;
}

export default function ImageSettings({ editor, attrs }: ImageSettingsProps) {
  const updateAttributes = (newAttrs: Record<string, any>) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('image', newAttrs).run();
  };

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
            onChange={(e) => updateAttributes({ ...attrs, width: e.target.value })}
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
            onChange={(e) => updateAttributes({ ...attrs, height: e.target.value })}
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
              onClick={() => updateAttributes({ ...attrs, align: 'left' })}
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
              onClick={() => updateAttributes({ ...attrs, align: 'center' })}
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
              onClick={() => updateAttributes({ ...attrs, align: 'right' })}
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
} 