'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  lastProfileUpdate: Date | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canUpdate, setCanUpdate] = useState(true);
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (session?.user) {
      fetchProfile();
    }
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile(data);
      setName(data.name || '');
      
      // 检查是否可以更新资料
      if (data.lastProfileUpdate) {
        const lastUpdate = new Date(data.lastProfileUpdate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 7) {
          setCanUpdate(false);
          const nextUpdateDate = new Date(lastUpdate);
          nextUpdateDate.setDate(nextUpdateDate.getDate() + 7);
          
          const daysLeft = 7 - diffDays;
          setTimeUntilNextUpdate(`${daysLeft} 天后可再次修改`);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('获取个人资料失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canUpdate) {
      setError('每周只能修改一次个人资料');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '更新资料失败');
      }
      
      setSuccess('个人资料已更新，正在刷新session...');
      fetchProfile(); // 重新获取资料
      
      // 更新session信息
      setTimeout(async () => {
        // 先调用登出然后重新登录来强制刷新session
        try {
          // 先调用登出 API
          await fetch('/api/auth/signout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          // 然后重定向到登录页面，带上自动登录参数
          window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent('/')}&email=${encodeURIComponent(profile?.email || '')}`;
        } catch (error) {
          // 如果出错，则使用原来的方法
          window.location.href = '/?refresh=true';
        }
      }, 1500);
    } catch (error: any) {
      setError(error.message || '更新资料失败');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 relative overflow-hidden">
      {/* 装饰元素 */}
      <div className="absolute bottom-0 left-0 w-full h-40 z-0">
        <Image src="/images/wave.svg" alt="Wave" width={1440} height={320} className="object-cover w-full" />
      </div>
      <div className="absolute top-20 right-10 w-64 h-64 z-0 opacity-70">
        <Image src="/images/blob.svg" alt="Blob" width={256} height={256} />
      </div>
      <div className="absolute bottom-40 left-10 w-64 h-64 z-0 opacity-70">
        <Image src="/images/chinese-pattern.svg" alt="Chinese Pattern" width={200} height={200} className="-rotate-12" />
      </div>
      
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">个人中心</h1>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          {profile ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">电子邮箱</p>
                <p className="text-slate-800">{profile.email}</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm text-gray-500 mb-1">
                    用户名
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canUpdate || isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {!canUpdate && (
                    <p className="text-sm text-amber-600 mt-1">
                      {timeUntilNextUpdate}
                    </p>
                  )}
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={!canUpdate || isLoading}
                    className={`px-4 py-2 rounded-md text-white flex items-center justify-center ${
                      canUpdate ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400'
                    } transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        更新中...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        更新资料
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="border-t border-gray-200 pt-4">
                <h2 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  账户信息
                </h2>
                <div className="bg-indigo-50 rounded-md p-3 mt-2">
                  <p className="text-sm text-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    上次资料更新时间: {profile.lastProfileUpdate ? new Date(profile.lastProfileUpdate).toLocaleString('zh-CN') : '从未更新'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">加载中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
