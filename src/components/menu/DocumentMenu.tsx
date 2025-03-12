import { useState, useRef, useEffect } from 'react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { PencilIcon, PlusIcon, ArrowUpTrayIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DocumentMenuProps {
  onRename: () => void;
  onCreateChild: () => void;
  onDelete: () => void;
  onMakeRoot?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveTop?: ()=>void;
  onMoveBottom?: ()=>void;
}

export default function DocumentMenu({ 
  onRename, 
  onCreateChild, 
  onDelete,
  onMakeRoot,
  onMoveUp,
  onMoveDown,
  onMoveTop,
  onMoveBottom
}: DocumentMenuProps) {
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity',
          isOpen ? 'bg-slate-200 opacity-100' : 'hover:bg-slate-100'
        )}
      >
        <EllipsisHorizontalIcon className="w-4 h-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <PencilIcon className="w-4 h-4" />
            重命名
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateChild();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <PlusIcon className="w-4 h-4" />
            新建子文档
          </button>
          {onMakeRoot && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMakeRoot();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              独立文档
            </button>
          )}
          {(onMoveUp || onMoveDown) && (
            <div className="flex border-t border-slate-200 mt-1 pt-1">
              {onMoveUp && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp();
                    setIsOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <ArrowUpIcon className="w-4 h-4" />
                  上移
                </button>
              )}
              {onMoveDown && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown();
                    setIsOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <ArrowDownIcon className="w-4 h-4" />
                  下移
                </button>
              )}
            </div>
          )}
          {(onMoveTop || onMoveBottom) && (
            <div className="flex border-t border-slate-200 mt-1 pt-1">
              {onMoveTop && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveTop();
                    setIsOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <ArrowUpIcon className="w-4 h-4" />
                  置顶
                </button>
              )}
              {onMoveBottom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveBottom();
                    setIsOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <ArrowDownIcon className="w-4 h-4" />
                  置底
                </button>
              )}
            </div>
          )}
          <div className="border-t border-slate-200 mt-1 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
            >
              <TrashIcon className="w-4 h-4" />
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 