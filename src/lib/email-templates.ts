import { EmailTemplate } from './types';

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #4F46E5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #ffffff;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 0.875rem;
            color: #6B7280;
        }
        .code {
            background: #F3F4F6;
            padding: 12px;
            border-radius: 6px;
            font-size: 24px;
            letter-spacing: 4px;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>DigeDoc</h1>
    </div>
    <div class="content">
        ${content}
    </div>
    <div class="footer">
        <p>此邮件由系统自动发送，请勿回复</p>
        <p>© ${new Date().getFullYear()} DigeDoc. 保留所有权利。</p>
    </div>
</body>
</html>
`;

export const emailTemplates = {
    verificationCode: (code: string): EmailTemplate => ({
        subject: 'DigeDoc - 邮箱验证码',
        html: baseTemplate(`
            <h2>验证您的邮箱地址</h2>
            <p>您好！感谢您注册 DigeDoc。请使用以下验证码完成邮箱验证：</p>
            <div class="code">${code}</div>
            <p>验证码有效期为15分钟。如果您没有请求此验证码，请忽略此邮件。</p>
            <p>为了保护您的账户安全，请勿将验证码分享给他人。</p>
        `)
    }),

    resetPassword: (resetLink: string): EmailTemplate => ({
        subject: 'DigeDoc - 重置密码',
        html: baseTemplate(`
            <h2>重置您的密码</h2>
            <p>您好！我们收到了重置密码的请求。</p>
            <p>请点击下面的按钮重置您的密码：</p>
            <a href="${resetLink}" class="button">重置密码</a>
            <p>如果按钮无法点击，您也可以复制以下链接到浏览器地址栏：</p>
            <p style="word-break: break-all;">${resetLink}</p>
            <p>此链接将在30分钟后失效。如果您没有请求重置密码，请忽略此邮件。</p>
        `)
    }),

    welcomeUser: (name: string): EmailTemplate => ({
        subject: 'DigeDoc - 欢迎加入',
        html: baseTemplate(`
            <h2>欢迎加入 DigeDoc！</h2>
            <p>亲爱的 ${name}：</p>
            <p>感谢您选择 DigeDoc 作为您的文档管理工具。我们很高兴能够为您提供服务。</p>
            <p>现在您可以：</p>
            <ul>
                <li>创建和管理文档</li>
                <li>邀请团队成员协作</li>
                <li>使用强大的编辑功能</li>
                <li>随时随地访问您的文档</li>
            </ul>
            <a href="https://docs.digidoc.com/getting-started" class="button">查看入门指南</a>
            <p>如果您在使用过程中遇到任何问题，欢迎随时联系我们的支持团队。</p>
        `)
    })
};

export type EmailTemplateType = keyof typeof emailTemplates; 