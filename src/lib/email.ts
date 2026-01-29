import nodemailer from 'nodemailer'

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailVerificationData {
  email: string;
  token: string;
  username: string;
}

export async function sendVerificationEmail(data: EmailVerificationData) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${data.token}`

  const mailOptions = {
    from: `"文鳐Couplet" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: '验证您的邮箱地址',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">欢迎加入文鳐Couplet！</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">请验证您的邮箱地址以完成注册</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
            您好 <strong>${data.username}</strong>，
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            感谢您注册文鳐Couplet！为了确保您的账户安全，请点击下面的按钮验证您的邮箱地址：
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      display: inline-block; 
                      font-weight: bold;
                      font-size: 16px;">
              验证邮箱地址
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
            如果按钮无法点击，请复制以下链接到浏览器地址栏：
          </p>
          
          <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #495057;">
            ${verificationUrl}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              此链接将在24小时后失效。如果您没有注册文鳐Couplet，请忽略此邮件。
            </p>
          </div>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('发送邮件失败:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(data: { email: string; token: string; username: string }) {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${data.token}`

  const mailOptions = {
    from: `"文鳐Couplet" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: '重置您的密码',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">密码重置请求</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">请点击下面的按钮重置您的密码</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
            您好 <strong>${data.username}</strong>，
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            我们收到了您的密码重置请求。请点击下面的按钮重置您的密码：
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      display: inline-block; 
                      font-weight: bold;
                      font-size: 16px;">
              重置密码
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
            如果按钮无法点击，请复制以下链接到浏览器地址栏：
          </p>
          
          <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #495057;">
            ${resetUrl}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              此链接将在1小时后失效。如果您没有请求重置密码，请忽略此邮件。
            </p>
          </div>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('发送邮件失败:', error)
    return { success: false, error }
  }
}

export interface PaymentReviewData {
  adminEmail: string;
  orderNo: string;
  userSubmittedTransactionId: string;
  amount: string;
  planName: string;
}

export async function sendPaymentReviewEmail(data: PaymentReviewData) {
  const adminDashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/vip/orders` // 假设管理员订单页面

  const mailOptions = {
    from: `"文鳐Couplet - 系统通知" <${process.env.SMTP_USER}>`,
    to: data.adminEmail,
    subject: `[支付审核] 新的用户支付等待审核 - 订单号: ${data.orderNo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f0932b 0%, #e84118 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">新的支付审核请求</h1>
        </div>
        
        <div style="padding: 30px;">
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
            管理员您好，
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            有一个新的用户支付需要您审核。请登录后台核实以下信息：
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
            <p style="margin: 10px 0;"><strong>订单号:</strong> ${data.orderNo}</p>
            <p style="margin: 10px 0;"><strong>用户提交的交易单号:</strong> ${data.userSubmittedTransactionId}</p>
            <p style="margin: 10px 0;"><strong>套餐名称:</strong> ${data.planName}</p>
            <p style="margin: 10px 0;"><strong>订单金额:</strong> ¥${data.amount}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminDashboardUrl}" 
               style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      display: inline-block; 
                      font-weight: bold;
                      font-size: 16px;">
              前往后台审核
            </a>
          </div>
        </div>

        <div style="background: #f1f1f1; padding: 15px; text-align: center; color: #888; font-size: 12px;">
            <p style="margin: 0;">这是来自文鳐Couplet的自动通知。</p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('发送管理员通知邮件失败:', error)
    return { success: false, error }
  }
}

export interface OrderStatusUpdateData {
  email: string;
  username: string;
  orderNo: string;
  planName: string;
  status: 'passed' | 'rejected';
  rejectionReason?: string;
}

export async function sendOrderStatusUpdateEmail(data: OrderStatusUpdateData) {
  const isPassed = data.status === 'passed'
  const subject = isPassed
    ? `您的订单已通过审核 - ${data.planName} 已激活`
    : '您的订单审核未通过'

  const mailOptions = {
    from: `"文鳐Couplet" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject,
    html: isPassed
      ? generatePassedEmailHtml(data)
      : generateRejectedEmailHtml(data),
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('发送订单状态更新邮件失败:', error)
    return { success: false, error }
  }
}

function generatePassedEmailHtml(data: OrderStatusUpdateData) {
  const myAccountUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/profile`
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">订单审核通过！</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">您的 VIP 套餐已成功激活</p>
      </div>
      <div style="padding: 30px;">
        <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
          您好 <strong>${data.username}</strong>，
        </p>
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
          我们很高兴地通知您，您的订单（订单号: ${data.orderNo}）已成功通过审核。
        </p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
          <p style="margin: 10px 0;"><strong>套餐名称:</strong> ${data.planName}</p>
          <p style="margin: 10px 0;"><strong>状态:</strong> <span style="color: #28a745; font-weight: bold;">已激活</span></p>
        </div>
        <p style="color: #666; line-height: 1.6; margin-top: 25px;">
          您可以随时登录您的账户查看会员状态。
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${myAccountUrl}" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
            查看我的账户
          </a>
        </div>
      </div>
      <div style="background: #f1f1f1; padding: 15px; text-align: center; color: #888; font-size: 12px;">
        <p style="margin: 0;">感谢您的支持！</p>
      </div>
    </div>
  `
}

function generateRejectedEmailHtml(data: OrderStatusUpdateData) {
  const contactUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/contact`
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">订单审核未通过</h1>
      </div>
      <div style="padding: 30px;">
        <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
          您好 <strong>${data.username}</strong>，
        </p>
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
          我们很遗憾地通知您，您的订单（订单号: ${data.orderNo}）未能通过审核。
        </p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
          <p style="margin: 10px 0;"><strong>套餐名称:</strong> ${data.planName}</p>
          <p style="margin: 10px 0;"><strong>拒绝原因:</strong></p>
          <p style="margin: 10px 0 10px 10px; padding: 10px; background: #fff; border-left: 3px solid #dc3545;">${data.rejectionReason || '未提供具体原因'}</p>
        </div>
        <p style="color: #666; line-height: 1.6; margin-top: 25px;">
          如有疑问，或需要重新提交信息，请联系我们的客服。
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${contactUrl}" style="background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
            联系我们
          </a>
        </div>
      </div>
      <div style="background: #f1f1f1; padding: 15px; text-align: center; color: #888; font-size: 12px;">
        <p style="margin: 0;">对此造成的不便，我们深表歉意。</p>
      </div>
    </div>
  `
}
