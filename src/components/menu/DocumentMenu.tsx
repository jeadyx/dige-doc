import { useState, useRef, useEffect } from 'react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface DocumentMenuProps {
  onRename: () => void;
  onCreateChild: () => void;
  onDelete: () => void;
}

export default function DocumentMenu({ onRename, onCreateChild, onDelete }: DocumentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { label: '重命名', onClick: () => { setIsOpen(false); onRename(); } },
    { label: '新建子文档', onClick: () => { setIsOpen(false); onCreateChild(); } },
    { label: '删除', onClick: () => { setIsOpen(false); onDelete(); }, className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={cn(
          'p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100',
          isOpen ? 'bg-slate-100' : 'hover:bg-slate-50'
        )}
      >
        <EllipsisHorizontalIcon className="w-5 h-5 text-slate-500" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); item.onClick(); }}
              className={cn(
                'w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors',
                item.className
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 