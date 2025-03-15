'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import PrivacyToggle from '@/components/document/PrivacyToggle';
import ReactionButtons from '@/components/document/ReactionButtons';
import ForkButton from '@/components/document/ForkButton';

interface NavbarProps {
  selectedDocument?: any;
  onUpdateDocumentPrivacy?: (id: string, isPublic: boolean) => void;
  onForkDocument?: (id: string) => Promise<void>;
}

export default function Navbar({ selectedDocument, onUpdateDocumentPrivacy, onForkDocument }: NavbarProps) {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 左侧区域：只放应用名称和文档标题 */}
          <div className="flex items-center space-x-4 overflow-hidden">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                DigeDoc
              </Link>
            </div>
            
            {/* 文档标题 */}
            {selectedDocument && (
              <div className="flex max-w-[200px] min-w-[200px] items-center ml-4 pl-4 border-l border-gray-200 overflow-hidden">
                <h1 className="text-lg font-semibold text-slate-800 truncate max-w-[300px]">
                  {selectedDocument.title}
                </h1>
              </div>
            )}
          </div>

          {/* 右侧区域：放置所有其他内容 */}
          <div className="flex items-center gap-3 overflow-hidden">
            {selectedDocument && (
              <div className="flex items-center gap-2 mr-4">
                <PrivacyToggle 
                  isPublic={selectedDocument.isPublic} 
                  documentId={selectedDocument.id} 
                  onToggle={(isPublic) => onUpdateDocumentPrivacy?.(selectedDocument.id, isPublic)}
                  disabled={!session?.user || session?.user?.id !== selectedDocument.userId}
                />
                {/* Fork按钮 - 只有公开文档才能被Fork，且不能是自己的文档 */}
                {selectedDocument.isPublic && session?.user && session.user.id !== selectedDocument.userId && (
                  <ForkButton
                    documentId={selectedDocument.id}
                    onFork={onForkDocument || (async () => {})}
                    forkCount={selectedDocument.forkCount || 0}
                  />
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {/* 作者信息 */}
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="author-name">作者: {selectedDocument.authorName || '匿名'}</span>
                  </span>
                  {/* 创建时间 */}
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>创建: {formatDate(selectedDocument.createdAt)}</span>
                  </span>
                  {/* 更新时间 */}
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>更新: {formatDate(selectedDocument.updatedAt)}</span>
                  </span>

                  {/* 点赞和踩按钮 */}
                  <ReactionButtons documentId={selectedDocument.id} />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center z-20 ml-4">
            {status === 'loading' ? (
              <div className="text-sm text-gray-500">加载中...</div>
            ) : session ? (
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center max-w-xs text-sm rounded-md bg-slate-50 px-3 py-1.5 focus:outline-none border border-slate-200"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="mr-2 text-gray-700">{session.user.name || session.user.email}</span>
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-30">
                    <Link
                      href="/profile"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      个人中心
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
