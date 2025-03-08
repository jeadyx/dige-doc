'use client';

import { DocumentTree as DocumentTreeType } from '@/types/document';
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, ChevronDoubleDownIcon, ChevronDoubleUpIcon } from '@heroicons/react/24/outline';
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
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  onSelect: (id: string) => void;
  onCreateChild: (parentId: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

function TreeItem({
  item,
  level,
  selectedId,
  isAllExpanded,
  onSelect,
  onCreateChild,
  onRename,
  onDelete,
}: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(item.title);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = item.children && item.children.length > 0;

  useEffect(() => {
    if (isAllExpanded !== undefined) {
      setIsExpanded(isAllExpanded);
    }
  }, [isAllExpanded]);

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

  return (
    <div style={style}>
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
            />
          </>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          <SortableContext
            items={item.children.map(child => child.id)}
            strategy={verticalListSortingStrategy}
          >
            {item.children!.map((child) => (
              <TreeItem
                key={child.id}
                item={child}
                level={level + 1}
                selectedId={selectedId}
                isAllExpanded={isAllExpanded}
                onSelect={onSelect}
                onCreateChild={onCreateChild}
                onRename={onRename}
                onDelete={onDelete}
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

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== 'document' || overData?.type !== 'document') return;

    // 防止循环嵌套
    const isNested = (parent: DocumentTreeType, childId: string): boolean => {
      if (!parent.children) return false;
      return parent.children.some(child => 
        child.id === childId || isNested(child, childId)
      );
    };

    const activeDoc = documents.find(doc => doc.id === activeId);
    const overDoc = documents.find(doc => doc.id === overId);

    if (activeDoc && overDoc && isNested(activeDoc, overId)) return;

    onMove(activeId, overId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== 'document' || overData?.type !== 'document') return;

    const activeParentId = activeData.parentId;
    const overParentId = overData.parentId;

    if (activeParentId === overParentId) {
      const items = documents.filter(doc => doc.parentId === activeParentId);
      const oldIndex = items.findIndex(item => item.id === activeId);
      const newIndex = items.findIndex(item => item.id === overId);
      onReorder(activeId, activeParentId, newIndex);
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
        >
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
                  onSelect={onSelect}
                  onCreateChild={onCreateChild}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>
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