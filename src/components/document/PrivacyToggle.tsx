'use client';

import { useState } from 'react';
import { LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface PrivacyToggleProps {
  isPublic: boolean;
  documentId: string;
  onToggle: (isPublic: boolean) => void;
  disabled?: boolean;
}

export default function PrivacyToggle({ isPublic, documentId, onToggle, disabled = false }: PrivacyToggleProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: !isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update document privacy');
      }

      onToggle(!isPublic);
    } catch (error) {
      console.error('Error updating document privacy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || isLoading}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
      }`}
      title={isPublic ? '公开文档 - 所有人可见' : '私有文档 - 仅自己可见'}
    >
      {isPublic ? (
        <>
          <GlobeAltIcon className="w-4 h-4 text-green-600" />
          <span className="text-green-600">公开</span>
        </>
      ) : (
        <>
          <LockClosedIcon className="w-4 h-4 text-gray-600" />
          <span className="text-gray-600">私有</span>
        </>
      )}
      {isLoading && <span className="ml-1 animate-pulse">...</span>}
    </button>
  );
}
