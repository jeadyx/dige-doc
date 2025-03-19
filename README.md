# DigeDoc

DigeDoc 是一个现代化的文档管理系统，使用 Next.js 14 构建，提供安全的用户认证和实时协作功能。

## 功能特点

- 🔐 安全的用户认证系统
  - 邮箱验证码注册
  - 密码强度检查
  - 登录失败次数限制
  - JWT 会话管理

- 📝 文档管理
  - 实时协作编辑
  - 版本历史记录
  - 文档分享功能
  - 支持公开和私有文档

## 技术栈

- **前端框架**: Next.js 14
- **样式方案**: Tailwind CSS
- **数据库**: Prisma + SQLite
- **认证**: NextAuth.js
- **邮件服务**: Nodemailer
- **密码加密**: bcryptjs

## 开始使用

### 环境要求

- Node.js 18.0.0 或更高版本
- pnpm 8.0.0 或更高版本

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/your-username/dige-doc.git
cd dige-doc
```

2. 安装依赖
```bash
pnpm install
```

3. 配置环境变量
```bash
cp .env.example .env
```
编辑 `.env` 文件，填写必要的环境变量：
- 数据库配置
- NextAuth 密钥
- 邮件服务配置

4. 初始化数据库
```bash
pnpm prisma db push
```

5. 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000 开始使用。

### 环境变量配置

必要的环境变量包括：

```env
# 数据库配置
DATABASE_URL="file:./dev.db"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# 邮件服务配置
EMAIL_HOST="smtp.example.com"
EMAIL_PORT="465"
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-email-password"
EMAIL_FROM="DigeDoc <your-email@example.com>"
```

## 部署

### 生产环境构建

```bash
pnpm build
pnpm start
```

### 使用 Docker 部署

1. 构建镜像
```bash
docker build -t dige-doc .
```

2. 运行容器
```bash
docker run -p 3000:3000 dige-doc
```

## 开发指南

### 项目结构

```
src/
├── app/                 # Next.js 14 App Router
├── components/         # React 组件
├── lib/               # 工具函数和配置
├── types/             # TypeScript 类型定义
└── styles/            # 全局样式
```

### 主要功能模块

- `src/lib/auth.ts`: 认证相关功能
- `src/lib/email.ts`: 邮件发送功能
- `src/lib/prisma.ts`: 数据库配置

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 进行代码格式化

## 安全性

- 使用 bcryptjs 进行密码加密
- 实现登录失败次数限制
- 邮箱验证码有效期限制
- CSRF 保护
- XSS 防护

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

[MIT License](LICENSE)

## 联系方式

- 项目维护者: [Your Name]
- Email: [your-email@example.com]
- 项目主页: [https://github.com/your-username/dige-doc]
