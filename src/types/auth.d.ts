// 为 @/lib/auth 模块提供类型声明
declare module '@/lib/auth' {
  import { NextAuthOptions } from 'next-auth';
  export const authOptions: NextAuthOptions;
}
