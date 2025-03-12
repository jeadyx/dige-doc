'use client';

import { DocumentTree as DocumentTreeType } from '@/types/document';
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, ChevronDoubleDownIcon, ChevronDoubleUpIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import DocumentMenu from '../menu/DocumentMenu';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  getFirstCollision,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 调试日志前缀
const LOG_PREFIX = '[DocumentTree]';

// 调试日志函数
const log = (action: string, data?: any) => {
  console.log(`${LOG_PREFIX} ${action}:`, data);
};

interface DocumentTreeProps {
  documents: DocumentTreeType[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onCreateChild: (parentId: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, parentId: string | undefined) => void;
  onReorder: (id: string, parentId: string | undefined, index: number) => void;
}

interface TreeItemProps {
  item: DocumentTreeType;
  level: number;
  selectedId?: string;
  isAllExpanded?: boolean;
  documents: DocumentTreeType[];
  onSelect: (id: string) => void;
  onCreateChild: (parentId: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, parentId: string | undefined) => void;
  onReorder: (id: string, parentId: string | undefined, index: number) => void;
}

function TreeItem({
  item,
  level,
  selectedId,
  isAllExpanded,
  documents,
  onSelect,
  onCreateChild,
  onRename,
  onDelete,
  onMove,
  onReorder,
}: TreeItemProps) {
  // 从 localStorage 获取初始展开状态
  const getInitialExpandedState = () => {
    const savedState = localStorage.getItem(`document-expanded-${item.id}`);
    return savedState !== null ? savedState === 'true' : true;
  };

  const [isExpanded, setIsExpanded] = useState(getInitialExpandedState());
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(item.title);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 保存展开状态到 localStorage
  useEffect(() => {
    localStorage.setItem(`document-expanded-${item.id}`, String(isExpanded));
  }, [isExpanded, item.id]);

  // 响应全局展开/折叠操作
  useEffect(() => {
    if (isAllExpanded !== undefined) {
      setIsExpanded(isAllExpanded);
      localStorage.setItem(`document-expanded-${item.id}`, String(isAllExpanded));
    }
  }, [isAllExpanded, item.id]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'document',
      parentId: item.parentId,
      children: item.children,
      index: item.order,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1 : 'auto',
  };

  const hasChildren = item.children && item.children.length > 0;

  const handleRename = () => {
    setIsRenaming(true);
    setNewTitle(item.title);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newTitle.trim() && newTitle !== item.title) {
      setIsSubmitting(true);
      onRename(item.id, newTitle.trim());
    }
    setIsRenaming(false);
  };

  // 处理独立文档
  const handleMakeRoot = () => {
    if (!item.parentId) return;
    
    log('MakeRoot', {
      id: item.id,
      title: item.title,
      fromParent: item.parentId
    });
    
    onMove(item.id, '');
  };

  // 通用的移动处理函数
  const handleMove = (direction: 'up' | 'down' | 'top' | 'bottom') => {
    console.log(`${LOG_PREFIX} Move${direction.charAt(0).toUpperCase() + direction.slice(1)} - Start:`, {
      id: item.id,
      title: item.title,
      parentId: item.parentId,
      order: item.order
    });

    // 找出父级id是parentId的文档
    const parentDoc = documents.find(doc => doc.id === item.parentId) || { children: [] };
    // 从它的children中进行过滤
    const siblings = (parentDoc.children && parentDoc.children.length > 0 ? parentDoc.children : documents)
      .filter(doc => doc.parentId === item.parentId)
      .sort((a, b) => a.order - b.order);
    
    console.log(`${LOG_PREFIX} Move${direction.charAt(0).toUpperCase() + direction.slice(1)} - Siblings:`, {
      count: siblings.length,
      siblings: siblings.map(doc => ({
        id: doc.id,
        title: doc.title,
        order: doc.order
      }))
    });
    
    const currentIndex = siblings.findIndex(doc => doc.id === item.id);
    
    // 根据不同的移动方向确定目标位置和是否可以移动
    let targetIndex: number;
    let canMove: boolean;

    switch (direction) {
      case 'top':
        targetIndex = 0;
        canMove = currentIndex > 0;
        break;
      case 'bottom':
        targetIndex = siblings.length - 1;
        canMove = currentIndex < siblings.length - 1;
        break;
      case 'up':
        targetIndex = currentIndex - 1;
        canMove = currentIndex > 0;
        break;
      case 'down':
        targetIndex = currentIndex + 1;
        canMove = currentIndex < siblings.length - 1;
        break;
    }

    if (canMove) {
      console.log(`${LOG_PREFIX} Move${direction.charAt(0).toUpperCase() + direction.slice(1)} - Moving document:`, {
        id: item.id,
        parentId: item.parentId || undefined,
        fromIndex: currentIndex,
        toIndex: targetIndex
      });
      
      onReorder(item.id, item.parentId || undefined, targetIndex);
    } else {
      console.log(`${LOG_PREFIX} Move${direction.charAt(0).toUpperCase() + direction.slice(1)} - Cannot move ${direction}:`, {
        reason: currentIndex === -1 
          ? 'Document not found in siblings' 
          : `Already at ${direction === 'up' || direction === 'top' ? 'top' : 'bottom'}`
      });
    }
  };

  // 处理上移
  const handleMoveUp = () => {
    handleMove('up');
  };

  // 处理下移
  const handleMoveDown = () => {
    handleMove('down');
  };

  // 处理置顶
  const handleMoveTop = () => {
    handleMove('top');
  };

  // 处理置底
  const handleMoveBottom = () => {
    handleMove('bottom');
  };

  return (
    <div style={style}>
      <div
        id={`sortable-${item.parentId || 'root'}`}
        data-type="document"
        data-index={item.order}
        className="h-1 -mt-0.5 rounded-lg transition-all group-hover:bg-indigo-100"
      />
      <div
        ref={setNodeRef}
        className={cn(
          'group flex items-center px-3 py-1.5 rounded-lg transition-all',
          selectedId === item.id
            ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
            : 'text-slate-700 hover:bg-slate-50'
        )}
        style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
        {...attributes}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'p-0.5 rounded hover:bg-white/50 mr-1 transition-colors',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </button>
        <div {...listeners} className="cursor-grab active:cursor-grabbing">
          <DocumentIcon className="w-4 h-4 mr-1.5 text-slate-400 flex-shrink-0" />
        </div>
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex-1 min-w-0 flex items-center">
            <input
              id={`doc-${item.id}`}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 px-2 py-0.5 text-sm bg-white border border-indigo-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              autoFocus
            />
          </form>
        ) : (
          <>
            <button
              onClick={() => onSelect(item.id)}
              onDoubleClick={handleRename}
              className="flex-1 text-left truncate text-sm"
            >
              {item.title}
            </button>
            <DocumentMenu
              onRename={handleRename}
              onCreateChild={() => onCreateChild(item.id)}
              onDelete={() => onDelete(item.id)}
              onMakeRoot={item.parentId ? handleMakeRoot : undefined}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onMoveTop={handleMoveTop}
              onMoveBottom={handleMoveBottom}
            />
          </>
        )}
      </div>
      <div
        id={`sortable-${item.parentId || 'root'}`}
        data-type="document"
        data-index={item.order + 1}
        className="h-1 mt-0.5 rounded-lg transition-all group-hover:bg-indigo-100"
      />
      {hasChildren && isExpanded && item.children && (
        <div className="mt-0.5">
          <SortableContext
            items={item.children.map(child => child.id)}
            strategy={verticalListSortingStrategy}
          >
            {item.children.map((child) => (
              <TreeItem
                key={child.id}
                item={child}
                level={level + 1}
                selectedId={selectedId}
                isAllExpanded={isAllExpanded}
                documents={documents}
                onSelect={onSelect}
                onCreateChild={onCreateChild}
                onRename={onRename}
                onDelete={onDelete}
                onMove={onMove}
                onReorder={onReorder}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

export default function DocumentTree({
  documents,
  selectedId,
  onSelect,
  onCreateChild,
  onRename,
  onDelete,
  onMove,
  onReorder,
}: DocumentTreeProps) {
  const [isAllExpanded, setIsAllExpanded] = useState<boolean | undefined>(undefined);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // 获取所有文档（包括子文档）的扁平列表
  const getAllDocuments = (docs: DocumentTreeType[]): DocumentTreeType[] => {
    return docs.reduce((all: DocumentTreeType[], doc) => {
      all.push(doc);
      if (doc.children && doc.children.length > 0) {
        all.push(...getAllDocuments(doc.children));
      }
      return all;
    }, []);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // 这里只处理视觉反馈，不执行实际的移动操作
    setOverId(overId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // 获取所有文档的扁平列表
    const allDocs = getAllDocuments(documents);
    const activeDoc = allDocs.find(doc => doc.id === activeId);

    if (!activeDoc) {
      log('DragEnd - Document not found', { activeId });
      return;
    }

    log('DragEnd - Start', {
      activeDoc: { id: activeId, title: activeDoc.title, parentId: activeDoc.parentId },
      overId,
      isContainer: overId.startsWith('sortable-')
    });

    // 如果拖动到间隔区（sortable container）
    if (overId.startsWith('sortable-')) {
      const parentId = overId.replace('sortable-', '');
      const targetParentId = parentId === 'root' ? undefined : parentId;
      
      log('DragEnd - Container', {
        targetParentId,
        currentParentId: activeDoc.parentId,
        willChangeParent: activeDoc.parentId !== targetParentId
      });

      // 获取目标位置的文档列表
      const targetDocs = allDocs.filter(doc => 
        targetParentId ? doc.parentId === targetParentId : !doc.parentId
      );
      
      // 计算新的位置
      const newIndex = parseInt(over.data.current?.index as string);
      const oldIndex = targetDocs.findIndex(doc => doc.id === activeId);
      
      // 如果是在同一父级下排序
      if (activeDoc.parentId === targetParentId) {
        if (oldIndex !== -1) {
          const finalIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;
          log('DragEnd - Reorder', { id: activeId, parentId: targetParentId, finalIndex });
          onReorder(activeId, targetParentId, finalIndex);
        }
      } else {
        // 如果是移动到新的父级（包括移动到根级别）
        log('DragEnd - Change Parent', {
          id: activeId,
          fromParent: activeDoc.parentId,
          toParent: targetParentId
        });
        onMove(activeId, targetParentId);
      }
    } else {
      // 如果拖动到文档项上
      const overDoc = allDocs.find(doc => doc.id === overId);
      if (!overDoc) {
        log('DragEnd - Target not found', { overId });
        return;
      }

      // 防止循环嵌套
      const isNested = (parent: DocumentTreeType, childId: string): boolean => {
        if (!parent.children) return false;
        return parent.children.some(child => 
          child.id === childId || isNested(child, childId)
        );
      };

      // 检查是否试图将文档移动到其子文档中
      if (isNested(activeDoc, overId)) {
        log('DragEnd - Prevented circular nesting', {
          parentDoc: activeDoc.title,
          attemptedChild: overDoc.title
        });
        return;
      }

      // 移动文档成为目标文档的子项
      log('DragEnd - Move to child', {
        id: activeId,
        fromParent: activeDoc.parentId,
        toParent: overId
      });
      onMove(activeId, overId);
    }
  };

  const handleExpandAll = () => {
    setIsAllExpanded(true);
  };

  const handleCollapseAll = () => {
    setIsAllExpanded(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">文档列表</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExpandAll}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
            title="展开全部"
          >
            <ChevronDoubleDownIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleCollapseAll}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
            title="折叠全部"
          >
            <ChevronDoubleUpIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCenter}
        >
          <div
            id="sortable-root"
            data-type="document"
            data-index="0"
            className="h-2 rounded-lg transition-all hover:bg-indigo-100"
          />
          <SortableContext
            items={documents.map(doc => doc.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {documents.map((doc) => (
                <TreeItem
                  key={doc.id}
                  item={doc}
                  level={0}
                  selectedId={selectedId}
                  isAllExpanded={isAllExpanded}
                  documents={documents}
                  onSelect={onSelect}
                  onCreateChild={onCreateChild}
                  onRename={onRename}
                  onDelete={onDelete}
                  onMove={onMove}
                  onReorder={onReorder}
                />
              ))}
            </div>
          </SortableContext>
          <div
            id="sortable-root"
            data-type="document"
            data-index={documents.length}
            className="h-2 rounded-lg transition-all hover:bg-indigo-100"
          />
          <DragOverlay>
            {activeId ? (
              <div className="px-3 py-1.5 bg-white rounded-lg shadow-lg border border-indigo-200">
                <div className="flex items-center gap-1.5">
                  <DocumentIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">
                    {documents.find(doc => doc.id === activeId)?.title}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
} 