// 邮箱验证相关工具函数

import nodemailer from 'nodemailer';
import { EmailTemplate } from './types';

// 创建邮件发送器
export const createTransporter = () => {
  // 生产环境使用配置的 SMTP 服务器
  const port = parseInt(process.env.EMAIL_PORT || '465');
  const isSecure = port === 465; // 465端口默认使用SSL/TLS
  const config = {
    host: process.env.EMAIL_HOST,
    port: port,
    secure: isSecure, // 使用SSL/TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // 这里使用邮箱的授权码
    },
    // 163邮箱的特定配置
    secureConnection: true, // 使用SSL
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false // 关闭证书验证以解决可能的SSL问题
    }
  };

  // 在开发环境中打印配置（不包含敏感信息）
  if (process.env.NODE_ENV === 'development') {
    console.log('Email configuration:', {
      ...config,
      auth: {
        user: config.auth.user,
        pass: '******' // 隐藏授权码
      }
    });
  }

  return nodemailer.createTransport(config);
};

// 生成6位数字验证码
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 创建HTML邮件模板
function createEmailTemplate(code: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .code-container {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .verification-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #4f46e5;
          }
          .note {
            font-size: 14px;
            color: #666;
            margin-top: 20px;
            text-align: center;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>邮箱验证码</h1>
          </div>
          <p>您好！</p>
          <p>感谢您注册我们的服务。请使用以下验证码完成邮箱验证：</p>
          <div class="code-container">
            <div class="verification-code">${code}</div>
          </div>
          <p class="note">
            验证码有效期为10分钟。如果这不是您的操作，请忽略此邮件。
            <br>
            请勿将验证码泄露给他人。
          </p>
          <div class="footer">
            此邮件由系统自动发送，请勿回复。
          </div>
        </div>
      </body>
    </html>
  `;
}

// 发送验证码邮件
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,  // 直接使用配置的发件人
      to: email,
      subject: 'DigeDoc - 邮箱验证码',
      html: createEmailTemplate(code),
      // 添加额外的邮件头
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    // 在开发环境中，打印验证码和配置信息到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log('==========================================');
      console.log('📧 邮件发送配置:');
      console.log('发件人:', process.env.EMAIL_FROM);
      console.log('收件人:', email);
      console.log('SMTP服务器:', process.env.EMAIL_HOST);
      console.log('端口:', process.env.EMAIL_PORT);
      console.log('🔑 验证码:', code);
      console.log('==========================================');
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    // 打印更详细的错误信息
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    return false;
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail({ to, subject, html }: EmailTemplate & { to: string }) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      priority: 'high',
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Email configuration:', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        from: process.env.EMAIL_FROM,
      });
    }

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Email sent:', info);
    }

    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
