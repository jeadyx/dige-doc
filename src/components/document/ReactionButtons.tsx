'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ReactionButtonsProps {
  documentId: string;
}

interface ReactionStats {
  likes: number;
  dislikes: number;
  userReaction: 'like' | 'dislike' | null;
}

export default function ReactionButtons({ documentId }: ReactionButtonsProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ReactionStats>({ likes: 0, dislikes: 0, userReaction: null });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
  }, [documentId]);

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/reaction`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = async (type: 'like' | 'dislike' | null) => {
    if (!session) {
      // 如果用户未登录，提示登录
      alert('请先登录后再进行操作');
      return;
    }

    setIsLoading(true);
    try {
      // 如果用户点击了已经选择的反应，则取消该反应
      const newType = stats.userReaction === type ? null : type;
      
      const response = await fetch(`/api/documents/${documentId}/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: newType }),
      });

      if (response.ok) {
        // 重新获取最新的反应统计
        fetchReactions();
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleReaction('like')}
        disabled={isLoading}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
          stats.userReaction === 'like'
            ? 'bg-indigo-100 text-indigo-600'
            : 'text-gray-500 hover:text-indigo-600'
        }`}
        aria-label="点赞"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill={stats.userReaction === 'like' ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={stats.userReaction === 'like' ? 1 : 2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
        <span>{stats.likes}</span>
      </button>

      <button
        onClick={() => handleReaction('dislike')}
        disabled={isLoading}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
          stats.userReaction === 'dislike'
            ? 'bg-red-100 text-red-600'
            : 'text-gray-500 hover:text-red-600'
        }`}
        aria-label="踩"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill={stats.userReaction === 'dislike' ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={stats.userReaction === 'dislike' ? 1 : 2}
            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2"
          />
        </svg>
        <span>{stats.dislikes}</span>
      </button>
    </div>
  );
}
