import { NextAuthOptions } from 'next-auth';
import { DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare, hash } from 'bcryptjs';
import { prisma } from './prisma';
import { randomBytes } from 'crypto';

// 密码强度检查
export function checkPasswordStrength(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: '密码长度至少为8位' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const requirements = [
    { condition: hasUpperCase, message: '至少包含一个大写字母' },
    { condition: hasLowerCase, message: '至少包含一个小写字母' },
    { condition: hasNumbers, message: '至少包含一个数字' },
    { condition: hasSpecialChar, message: '至少包含一个特殊字符' },
  ];
  
  const failedRequirements = requirements
    .filter(req => !req.condition)
    .map(req => req.message);
  
  if (failedRequirements.length > 0) {
    return {
      isValid: false,
      message: `密码必须${failedRequirements.join('、')}`,
    };
  }
  
  return { isValid: true, message: '密码强度符合要求' };
}

// 登录失败次数限制
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15分钟

function isUserLockedOut(email: string): boolean {
  const attempts = loginAttempts.get(email);
  if (!attempts) return false;
  
  const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(email);
    return false;
  }
  
  return attempts.count >= MAX_LOGIN_ATTEMPTS;
}

function recordLoginAttempt(email: string, success: boolean) {
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: new Date() };
  
  if (success) {
    loginAttempts.delete(email);
  } else {
    attempts.count += 1;
    attempts.lastAttempt = new Date();
    loginAttempts.set(email, attempts);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 检查是否被锁定
        if (isUserLockedOut(credentials.email)) {
          throw new Error('账户已被锁定，请15分钟后再试');
        }

        // 使用类型断言来解决 Prisma 客户端类型问题
        const user = await (prisma as any).user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          recordLoginAttempt(credentials.email, false);
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          recordLoginAttempt(credentials.email, false);
          return null;
        }

        // 登录成功，重置失败次数
        recordLoginAttempt(credentials.email, true);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  // 确保总是有一个密钥，即使环境变量未设置
  secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-key-for-development-only",
};

// 扩展NextAuth类型
declare module 'next-auth' {
  interface User {
    id: string;
  }
  
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}
