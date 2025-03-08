'use client';

import { ExportFormat } from '@/types/document';
import { Download, Share2, Plus } from 'lucide-react';
import { useState } from 'react';

interface ToolbarProps {
  onNewDocument: () => void;
  onExport: (format: ExportFormat) => void;
  onShare: () => void;
  canShare: boolean;
}

export default function Toolbar({
  onNewDocument,
  onExport,
  onShare,
  canShare,
}: ToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="h-12 border-b px-4 flex items-center justify-between bg-white">
      <button
        onClick={onNewDocument}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100"
      >
        <Plus className="w-4 h-4" />
        新建文档
      </button>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-1 py-2 w-32 bg-white rounded-lg shadow-lg border">
              <button
                onClick={() => {
                  onExport('md');
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-1.5 text-sm text-left hover:bg-gray-100"
              >
                Markdown
              </button>
              <button
                onClick={() => {
                  onExport('html');
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-1.5 text-sm text-left hover:bg-gray-100"
              >
                HTML
              </button>
              <button
                onClick={() => {
                  onExport('docx');
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-1.5 text-sm text-left hover:bg-gray-100"
              >
                Word
              </button>
            </div>
          )}
        </div>

        {canShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100"
          >
            <Share2 className="w-4 h-4" />
            分享
          </button>
        )}
      </div>
    </div>
  );
} 