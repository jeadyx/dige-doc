// 邮箱验证相关工具函数

import nodemailer from 'nodemailer';

// 创建一个测试用的邮件发送器 (实际生产环境应使用真实的SMTP服务)
export const createTestTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'test@example.com', // 实际应用中应使用环境变量
      pass: process.env.EMAIL_PASS || 'password123',
    },
  });
};

// 生成随机验证码
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6位数字验证码
};

// 发送验证码邮件
export const sendVerificationEmail = async (
  email: string,
  code: string
): Promise<boolean> => {
  try {
    // 在开发环境中，只打印验证码到控制台，不实际发送邮件
    console.log('==========================================');
    console.log(`📧 发送验证码到 ${email}`);
    console.log(`🔑 验证码: ${code}`);
    console.log('==========================================');

    // 如果需要在生产环境中实际发送邮件，可以取消下面的注释
    if (process.env.NODE_ENV === 'production') {
      const transporter = createTestTransporter();
      
      // 发送邮件
      const info = await transporter.sendMail({
        from: '"DigeDoc" <noreply@digedoc.com>',
        to: email,
        subject: 'DigeDoc 邮箱验证码',
        text: `您的验证码是: ${code}，有效期为10分钟。`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #4f46e5;">DigeDoc 邮箱验证</h2>
            <p>您好，</p>
            <p>感谢您注册 DigeDoc。请使用以下验证码完成邮箱验证：</p>
            <div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p>此验证码有效期为10分钟。</p>
            <p>如果您没有请求此验证码，请忽略此邮件。</p>
            <p>祝好，<br>DigeDoc 团队</p>
          </div>
        `,
      });

      console.log('邮件发送成功:', info.messageId);
    }
    
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
};
