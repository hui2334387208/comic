# OAuth 第三方登录配置指南

本项目支持 Google 和 GitHub 第三方登录。请按照以下步骤配置：

## 1. Google OAuth 配置

### 1.1 创建 Google Cloud 项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API

### 1.2 配置 OAuth 凭据
1. 在左侧菜单中，转到 "API 和服务" > "凭据"
2. 点击 "创建凭据" > "OAuth 2.0 客户端 ID"
3. 选择应用类型为 "Web 应用程序"
4. 添加授权重定向 URI：
   - 开发环境：`http://localhost:3000/api/auth/callback/google`
   - 生产环境：`https://yourdomain.com/api/auth/callback/google`
5. 复制生成的客户端 ID 和客户端密钥

### 1.3 环境变量配置
在 `.env.local` 文件中添加：
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 2. GitHub OAuth 配置

### 2.1 创建 GitHub OAuth 应用
1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写应用信息：
   - Application name: 你的应用名称
   - Homepage URL: `http://localhost:3000` (开发环境)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. 点击 "Register application"
5. 复制生成的客户端 ID 和客户端密钥

### 2.2 环境变量配置
在 `.env.local` 文件中添加：
```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## 3. 生产环境配置

### 3.1 更新重定向 URI
在生产环境中，需要更新 OAuth 应用的重定向 URI：

**Google:**
- 将 `http://localhost:3000/api/auth/callback/google` 替换为 `https://yourdomain.com/api/auth/callback/google`

**GitHub:**
- 将 `http://localhost:3000/api/auth/callback/github` 替换为 `https://yourdomain.com/api/auth/callback/github`

### 3.2 更新环境变量
确保生产环境的环境变量指向正确的域名：
```env
NEXTAUTH_URL="https://yourdomain.com"
```

## 4. 功能特性

### 4.1 自动邮箱验证
- OAuth 登录的用户邮箱会自动验证
- 无需手动发送验证邮件

### 4.2 用户信息同步
- 自动获取用户的头像和基本信息
- 支持用户名自动生成（基于邮箱前缀）

### 4.3 安全特性
- 使用 JWT 策略进行会话管理
- 支持角色权限控制
- 完整的登录日志记录

## 5. 故障排除

### 5.1 常见错误
1. **"Invalid redirect_uri"**: 检查重定向 URI 是否配置正确
2. **"Client ID not found"**: 确认环境变量已正确设置
3. **"Invalid client secret"**: 检查客户端密钥是否正确

### 5.2 调试步骤
1. 检查浏览器控制台是否有错误信息
2. 确认环境变量已加载（重启开发服务器）
3. 验证 OAuth 应用配置是否正确
4. 检查网络连接和防火墙设置

## 6. 安全注意事项

1. **环境变量安全**: 不要将 `.env.local` 文件提交到版本控制系统
2. **客户端密钥**: 妥善保管客户端密钥，不要泄露
3. **HTTPS**: 生产环境必须使用 HTTPS
4. **域名验证**: 确保重定向 URI 使用正确的域名

## 7. 测试

配置完成后，可以测试 OAuth 登录：

1. 访问登录页面 `/sign-in`
2. 点击 "使用Google登录" 或 "使用GitHub登录"
3. 完成 OAuth 授权流程
4. 验证是否成功登录并跳转到首页

如果遇到问题，请检查浏览器控制台和服务器日志以获取详细错误信息。 