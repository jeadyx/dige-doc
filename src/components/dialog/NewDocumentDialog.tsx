import { useState } from 'react';
import { DocumentTree } from '@/types/document';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';

interface NewDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, parentId?: string) => void;
  documentTree: DocumentTree[];
}

export default function NewDocumentDialog({
  isOpen,
  onClose,
  onSubmit,
  documentTree,
}: NewDocumentDialogProps) {
  const [title, setTitle] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title, parentId);
    setTitle('');
    setParentId(undefined);
    onClose();
  };

  const renderTreeOptions = (items: DocumentTree[], level = 0) => {
    return items.map((item) => (
      <option key={item.id} value={item.id} className="py-1">
        {'\u00A0\u00A0'.repeat(level) + item.title}
      </option>
    ));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[480px] shadow-2xl">
        <h2 className="text-xl font-semibold mb-6 text-slate-900">新建文档</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                文档标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="输入文档标题"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                父文档（可选）
              </label>
              <div className="relative">
                <select
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value || undefined)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-10 text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  style={{ fontFamily: 'monospace' }}
                >
                  <option value="" className="py-1">作为顶级文档</option>
                  {renderTreeOptions(documentTree)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronUpDownIcon className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-300"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!title.trim()}
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 