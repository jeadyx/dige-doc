'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import LoginForm from './LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('邮箱或密码无效');
        setIsLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setError('登录过程中发生错误');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 relative overflow-hidden">
      {/* 装饰元素 */}
      <div className="absolute bottom-0 left-0 w-full h-40 z-0">
        <Image src="/images/wave.svg" alt="Wave" width={1440} height={320} className="object-cover w-full" />
      </div>
      <div className="absolute top-10 right-10 w-64 h-64 z-0">
        <Image src="/images/blob.svg" alt="Blob" width={256} height={256} />
      </div>
      <div className="absolute top-20 left-10 w-64 h-64 z-0">
        <Image src="/images/dots.svg" alt="Dots" width={200} height={200} />
      </div>
      <div className="absolute bottom-40 right-10 w-64 h-64 z-0 opacity-70">
        <Image src="/images/chinese-pattern.svg" alt="Chinese Pattern" width={200} height={200} className="rotate-12" />
      </div>
      
      {/* 登录卡片 */}
      <div className="max-w-md w-full space-y-6 p-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] z-10 relative">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">
            登录您的账户
          </h2>
          <p className="text-sm text-gray-500 mb-6">欢迎回来，请输入您的登录信息</p>
        </div>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm mb-6 animate-pulse" role="alert">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm">{error === 'Invalid email or password' ? '邮箱或密码无效' : error === 'An error occurred during login' ? '登录过程中发生错误' : error}</span>
            </div>
          </div>
        )}
        <LoginForm />
        <div className="mt-6 text-center">
          <Link 
            href="/forgot-password" 
            className="font-medium text-sm text-indigo-600 hover:text-indigo-500"
          >
            忘记密码？
          </Link>
        </div>
        <div className="mt-6 text-center">
          <Link href="/register" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-150 ease-in-out">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            没有账户？点击注册
          </Link>
        </div>
      </div>
    </div>
  );
}
