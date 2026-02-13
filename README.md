# 文鳐 Couplet - AI驱动的智能对联创作平台

二次元/动漫风格

[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> 专业的AI对联创作和学习平台，支持智能生成、分类管理、社交互动和教育功能

## ✨ 特性

- 🤖 **AI智能对联生成** - 基于DeepSeek和Groq的智能对联创作系统
- � **分类管理** - 支持按主题、风格、难度等多维度分类
- 🎓 **教育学习** - 完整的对联学习课程和练习系统
- 🎮 **游戏化学习** - 挑战关卡、成就系统和排行榜
- 👥 **社交互动** - 对联PK、协作创作和师徒系统
- 💎 **VIP会员** - 高级功能和专属内容
- 🌐 **多语言支持** - 完整的中英文国际化支持
- 📱 **PWA支持** - 渐进式Web应用，支持离线使用
- 🎨 **现代化UI** - 基于Ant Design和Tailwind CSS的美观界面
- 🔐 **用户认证** - 完整的用户注册、登录和权限管理
- 📈 **数据分析** - 用户行为统计和内容分析
- 🚀 **高性能** - 基于Next.js 15的优化性能

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL 数据库

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/couplet-platform.git
cd couplet-platform

# 安装依赖
npm install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env.local
```

2. 配置必要的环境变量：
```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/couplet"

# NextAuth配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AI服务配置
DEEPSEEK_API_KEY="your-deepseek-api-key"
GROQ_API_KEY="your-groq-api-key"

# 邮件服务配置
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@example.com"
EMAIL_SERVER_PASSWORD="your-email-password"

# 文件上传配置
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# VIP支付配置
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
```

### 数据库设置

```bash
# 生成数据库迁移文件
npm run db:generate

# 推送数据库变更
npm run db:push

# 启动数据库管理界面
npm run db:studio
```

### 启动开发服务器

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📋 可用命令

### 🚀 开发命令

```bash
# 启动开发服务器（使用 Turbopack）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 分析构建包大小
npm run analyze
```

### 🔍 代码质量检查

```bash
# ESLint 检查代码
npm run lint

# ESLint 自动修复
npm run lint:fix

# ESLint 严格模式（不允许警告）
npm run lint:strict

# TypeScript 类型检查
npm run type-check

# TypeScript 严格类型检查
npm run type-check:strict

# Prettier 格式化代码
npm run format

# Prettier 检查格式
npm run format:check

# 一键检查所有（ESLint + TypeScript + Prettier）
npm run check

# 一键修复所有（ESLint + Prettier）
npm run check:fix
```

### 🗄️ 数据库管理

```bash
# 启动 Drizzle Studio 数据库管理界面
npm run db:studio

# 生成数据库迁移文件
npm run db:generate

# 执行数据库迁移
npm run db:migrate

# 推送数据库变更（开发环境）
npm run db:push

# 删除数据库（谨慎使用）
npm run db:drop
```

### 🧹 清理命令

```bash
# 清理构建文件
npm run clean

# 清理所有缓存文件
npm run clean:all
```

### 🌐 国际化管理

```bash
# 检查 zh.json 和 en.json 的 key 结构一致性
node scripts/compare-i18n-keys.js

# 自动修复 i18n key 结构（会备份原文件）
node scripts/fix-i18n-keys.js

# 查看所有备份文件
node scripts/restore-i18n-backup.js list

# 恢复最新备份
node scripts/restore-i18n-backup.js latest

# 恢复指定备份
node scripts/restore-i18n-backup.js restore zh.json.backup.2024-01-15T10-30-00-000Z
```

**国际化脚本说明：**

- **compare-i18n-keys.js**: 递归对比两个翻译文件的所有 key 路径，输出不一致的地方
- **fix-i18n-keys.js**: 自动同步两个文件的 key 结构，确保完全一致，会自动备份原文件
- **restore-i18n-backup.js**: 管理备份文件，可以查看、恢复备份

**使用建议：**
1. 添加新翻译键时，先在两个文件中添加相同位置的键
2. 定期运行 `compare-i18n-keys.js` 检查一致性
3. 如果发现结构不一致，运行 `fix-i18n-keys.js` 自动修复
4. 修复前会自动备份，如有问题可随时回退

## 🎯 核心功能

### 🤖 AI对联生成
- 智能上联生成下联
- 多种风格和主题选择
- 实时生成和优化建议
- 支持批量生成和保存

### 📚 分类管理
- 按主题分类（节日、爱情、励志等）
- 按风格分类（古典、现代、幽默等）
- 按难度分级（初级、中级、高级）
- 标签系统和智能推荐

### 🎓 教育学习
- 对联基础知识课程
- 平仄声律教学
- 对仗技巧训练
- 每日练习和作业

### 🎮 游戏化学习
- 闯关模式学习
- 对联挑战赛
- 成就系统
- 排行榜竞争

### 👥 社交互动
- 对联PK对战
- 协作创作
- 师徒系统
- 社区讨论

### 💎 VIP会员
- 高级AI模型访问
- 专属内容和课程
- 无限制生成
- 优先客服支持

## 🎯 推荐工作流程

### 日常开发流程

```bash
# 1. 启动开发服务器
npm run dev

# 2. 修改代码后，提交前运行
npm run check:fix
```

### 发布前检查流程

```bash
# 1. 清理缓存
npm run clean:all

# 2. 完整代码检查
npm run check

# 3. 严格类型检查
npm run type-check:strict

# 4. 构建测试
npm run build
```

### 生产发布流程

```bash
# 1. 构建生产版本
npm run build

# 2. 启动生产服务器
npm start
```

### 数据库变更流程

```bash
# 1. 生成迁移文件
npm run db:generate

# 2. 执行迁移
npm run db:migrate
```

| 场景 | 推荐命令 | 说明 |
|------|----------|------|
| 日常开发 | `npm run dev` | 启动开发服务器 |
| 代码提交前 | `npm run check:fix` | 一键修复所有问题 |
| 发布前检查 | `npm run check` | 确保代码质量 |
| 生产构建 | `npm run build` | 构建生产版本 |
| 清理缓存 | `npm run clean:all` | 清理所有缓存 |

## 🎯 最佳实践

1. **开发时**：使用 `npm run dev` + `npm run check:fix`
2. **提交前**：总是运行 `npm run check:fix`
3. **发布前**：运行 `npm run check` + `npm run build`
4. **数据库变更**：使用 `npm run db:generate` + `npm run db:migrate`

## 📁 项目结构

```
couplet-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # 国际化路由
│   │   │   ├── (auth)/        # 认证相关页面
│   │   │   ├── (main)/        # 主要功能页面
│   │   │   │   ├── couplet/   # 对联浏览和创作
│   │   │   │   ├── education/ # 教育学习模块
│   │   │   │   ├── game/      # 游戏化学习
│   │   │   │   ├── social/    # 社交功能
│   │   │   │   └── vip/       # VIP会员
│   │   │   └── admin/         # 管理后台
│   │   ├── api/               # API路由
│   │   │   ├── couplet/       # 对联相关API
│   │   │   ├── education/     # 教育相关API
│   │   │   ├── game/          # 游戏相关API
│   │   │   ├── social/        # 社交相关API
│   │   │   └── vip/           # VIP相关API
│   │   └── globals.css        # 全局样式
│   ├── components/            # React组件
│   │   ├── couplet/          # 对联相关组件
│   │   ├── education/        # 教育相关组件
│   │   └── layout/           # 布局组件
│   ├── config/               # 配置文件
│   ├── db/                   # 数据库配置和Schema
│   │   └── schema/           # 数据库表结构
│   │       ├── couplet.ts    # 对联相关表
│   │       ├── education.ts  # 教育相关表
│   │       ├── gamification.ts # 游戏化相关表
│   │       ├── social.ts     # 社交相关表
│   │       └── vip.ts        # VIP相关表
│   ├── i18n/                 # 国际化配置
│   ├── lib/                  # 工具库
│   ├── styles/               # 样式文件
│   └── types/                # TypeScript类型定义
├── public/                   # 静态资源
├── messages/                 # 国际化消息文件
└── docs/                     # 文档
```

## 🛠️ 开发工具

### 代码质量工具

- **ESLint 9** - 代码检查和修复
- **Prettier 3** - 代码格式化
- **TypeScript 5** - 类型检查
- **Husky** - Git hooks 自动化
- **lint-staged** - 暂存文件检查

### 数据库工具

- **Drizzle ORM** - 类型安全的数据库操作
- **Drizzle Kit** - 数据库迁移和管理
- **PostgreSQL** - 关系型数据库

## 🎨 技术栈

### 前端
- **Next.js 15** - React全栈框架
- **React 19** - 用户界面库
- **TypeScript** - 类型安全
- **Tailwind CSS 4** - 样式框架
- **Ant Design** - UI组件库
- **Framer Motion** - 动画库

### 后端
- **Next.js API Routes** - 后端API
- **Drizzle ORM** - 数据库ORM
- **PostgreSQL** - 关系型数据库
- **NextAuth.js** - 身份认证

### AI & 工具
- **DeepSeek AI** - 智能生成
- **Groq AI** - 快速推理
- **Vercel Blob** - 文件存储
- **Nodemailer** - 邮件服务

### 开发工具
- **ESLint 9** - 代码检查
- **Prettier 3** - 代码格式化
- **Drizzle Kit** - 数据库工具
- **Husky** - Git hooks
- **lint-staged** - 暂存文件检查

## 📱 PWA功能

- ✅ 离线支持
- ✅ 应用安装
- ✅ 推送通知
- ✅ 后台同步
- ✅ 缓存策略

## 🌍 国际化

支持中文和英文两种语言，使用 `next-intl` 实现：

```typescript
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');
  return <h1>{t('title')}</h1>;
}
```

## 🔧 部署

### Vercel部署（推荐）

1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

### 自托管部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发规范

- 使用 `npm run check` 确保代码质量
- 使用 `npm run check:fix` 自动修复格式问题
- 遵循 TypeScript 类型安全
- 保持代码风格一致

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - 优秀的React框架
- [Ant Design](https://ant.design/) - 企业级UI组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [DeepSeek](https://www.deepseek.com/) - 强大的AI模型
- [Vercel](https://vercel.com/) - 优秀的部署平台

## 📞 联系我们

- 官网：[https://www.pairray.com](https://www.pairray.com)
- 邮箱：support@xuanwhale.com
- GitHub：[https://github.com/your-username/couplet-platform](https://github.com/your-username/couplet-platform)

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！

## 🎨 关于对联

对联是中华文化的瑰宝，承载着深厚的文学底蕴和艺术价值。本平台致力于：

- 📖 **传承文化** - 让更多人了解和学习对联艺术
- 🤖 **科技赋能** - 用AI技术降低对联创作门槛
- 🎓 **寓教于乐** - 通过游戏化方式提升学习兴趣
- 👥 **社区共建** - 打造对联爱好者的交流平台

文鳐 Couplet - 让对联艺术在数字时代焕发新的生机！

域名 pairray.com
风格 传统的中国风红色主题
FLUSHDB

漫画
├── 名称 (title)
├── 描述 (description) 
├── 标签 (tags)
├── 分类 (category)
├── 风格 (style)
└── 卷 (Volume)
    └── 话/章节 (episodes)
        ├── 第1话
        │   ├── 标题 (episode title)
        │   └── 分镜 (panels)
        │       ├── 第1个分镜
        │       │   ├── 画面描述 (scene description)
        │       │   ├── 对话 (dialogue)
        │       │   ├── 旁白 (narration)
        │       │   ├── 情感氛围 (emotion)
        │       │   ├── 镜头角度 (camera angle)
        │       │   └── 角色信息 (characters)
        │       ├── 第2个分镜
        │       └── ...
        └── 第2话...


漫画 (Comic)
├── 基本信息
│   ├── 名称 (title)
│   ├── 描述 (description)
│   ├── 标签 (tags)
│   ├── 分类 (category)
│   ├── 风格 (style)
│   └── 封面 (cover)
│
└── 卷 (Volumes)
    └── 第1卷
        ├── 卷标题 (volume title)
        ├── 卷封面 (volume cover)
        └── 话/章节 (Episodes/Chapters)
            └── 第1话
                ├── 话标题 (episode title)
                └── 页 (Pages)
                    └── 第1页
                        ├── 页面布局 (page layout)
                        └── 格/分镜 (Panels)
                            └── 第1格
                                ├── 画面描述 (scene description)
                                ├── 对话 (dialogue)
                                ├── 旁白 (narration)
                                ├── 情感氛围 (emotion)
                                ├── 镜头角度 (camera angle)
                                └── 角色信息 (characters)


