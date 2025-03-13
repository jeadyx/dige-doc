'use client';

import { useState } from 'react';
import StylePreview from '@/components/StyleMarket/StylePreview';
import StyleCart from '@/components/StyleMarket/StyleCart';
import { StyleCategory } from '@/types/style-market';

interface PreviewState {
  category: StyleCategory | null;
  style: string | null;
}

export default function StyleMarket() {
  const [selectedStyles, setSelectedStyles] = useState<Record<StyleCategory, string[]>>({
    heading1: [],
    heading2: [],
    heading3: [],
    blockquote: [],
    codeBlock: [],
    paragraph: [],
    link: [],
    list: [],
  });

  const [previewState, setPreviewState] = useState<PreviewState>({
    category: null,
    style: null
  });

  const handleAddStyle = (category: StyleCategory, style: string) => {
    setSelectedStyles(prev => ({
      ...prev,
      [category]: [...prev[category], style],
    }));
  };

  const handleRemoveStyle = (category: StyleCategory, style: string) => {
    setSelectedStyles(prev => ({
      ...prev,
      [category]: prev[category].filter(s => s !== style),
    }));
  };

  const handlePreviewStyle = (category: StyleCategory, style: string | null) => {
    setPreviewState({
      category: style ? category : null,
      style
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <StylePreview 
            onAddStyle={handleAddStyle} 
            onPreviewStyle={handlePreviewStyle}
          />
        </div>
        <div>
          <StyleCart
            selectedStyles={selectedStyles}
            onRemoveStyle={handleRemoveStyle}
            previewState={previewState}
          />
        </div>
      </div>
    </div>
  );
} 