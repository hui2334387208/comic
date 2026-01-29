# 贡献指南

感谢您对文鳐对联项目的关注！我们欢迎所有形式的贡献。

## 🚀 快速开始

### 环境设置

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 Fork 项目
   # 然后克隆到本地
   git clone https://github.com/YOUR_USERNAME/xuanwhale-timeline.git
   cd xuanwhale-timeline
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件，配置必要的环境变量
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 📝 开发流程

### 1. 创建分支

```bash
# 从 main 分支创建新分支
git checkout -b feature/your-feature-name
# 或者
git checkout -b fix/your-fix-name
```

### 2. 开发规范

#### 代码风格

我们使用以下工具确保代码质量：

- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **TypeScript** - 类型检查

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix

# 类型检查
npm run type-check

# 格式化代码
npm run format
```

#### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 功能开发
git commit -m "feat: add new timeline feature"

# 修复问题
git commit -m "fix: resolve timeline display issue"

# 文档更新
git commit -m "docs: update README"

# 样式调整
git commit -m "style: improve button styling"

# 重构代码
git commit -m "refactor: optimize timeline rendering"

# 测试相关
git commit -m "test: add timeline component tests"

# 构建相关
git commit -m "build: update dependencies"
```

### 3. 提交 Pull Request

1. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **创建 Pull Request**
   - 在 GitHub 上创建 Pull Request
   - 填写详细的描述
   - 添加相关的 Issue 链接

3. **PR 模板**
   ```markdown
   ## 描述
   简要描述这次更改的内容

   ## 类型
   - [ ] 新功能
   - [ ] 修复
   - [ ] 文档更新
   - [ ] 样式调整
   - [ ] 重构
   - [ ] 性能优化
   - [ ] 其他

   ## 测试
   - [ ] 本地测试通过
   - [ ] 添加了相关测试
   - [ ] 更新了文档

   ## 检查清单
   - [ ] 代码符合项目规范
   - [ ] 添加了必要的注释
   - [ ] 更新了相关文档
   - [ ] 测试覆盖了新功能
   ```

## 🎯 贡献类型

### 功能开发

1. **讨论功能**
   - 在 Issues 中讨论新功能
   - 确保功能符合项目目标

2. **实现功能**
   - 遵循现有的代码结构
   - 添加必要的类型定义
   - 更新相关文档

3. **测试功能**
   - 确保功能正常工作
   - 添加必要的测试用例

### Bug 修复

1. **报告 Bug**
   - 使用 Issue 模板
   - 提供详细的复现步骤
   - 包含环境信息

2. **修复 Bug**
   - 定位问题根源
   - 提供最小化的修复
   - 添加回归测试

### 文档改进

1. **README 更新**
   - 保持文档最新
   - 添加使用示例
   - 改进可读性

2. **代码注释**
   - 为复杂逻辑添加注释
   - 更新 API 文档
   - 添加 JSDoc 注释

### 性能优化

1. **性能分析**
   - 使用性能分析工具
   - 识别瓶颈
   - 测量改进效果

2. **优化实施**
   - 优化关键路径
   - 减少不必要的渲染
   - 优化资源加载

## 🔧 开发工具

### 推荐工具

- **VS Code** - 编辑器
- **GitHub Desktop** - Git 客户端
- **Postman** - API 测试
- **Chrome DevTools** - 调试工具

### VS Code 扩展

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

## 📋 代码审查

### 审查标准

- **功能正确性** - 代码是否按预期工作
- **代码质量** - 是否符合项目规范
- **性能影响** - 是否影响应用性能
- **安全性** - 是否存在安全风险
- **可维护性** - 代码是否易于维护

### 审查流程

1. **自动检查**
   - CI/CD 流水线检查
   - 代码质量检查
   - 测试覆盖率检查

2. **人工审查**
   - 至少需要一名维护者审查
   - 审查者提供反馈
   - 作者根据反馈修改

3. **合并条件**
   - 所有检查通过
   - 至少一名维护者批准
   - 解决所有反馈

## 🐛 报告问题

### Issue 模板

```markdown
## 问题描述
详细描述遇到的问题

## 复现步骤
1. 打开应用
2. 执行操作
3. 观察结果

## 预期行为
描述期望的正确行为

## 实际行为
描述实际观察到的行为

## 环境信息
- 操作系统：
- 浏览器：
- 版本：
- Node.js 版本：

## 附加信息
截图、日志等额外信息
```

## 📞 联系我们

- **GitHub Issues** - 报告问题和功能请求
- **GitHub Discussions** - 讨论和问答
- **邮箱** - contact@xuanwhale.com

## 🙏 致谢

感谢所有为项目做出贡献的开发者！

---

**注意**：请确保您的贡献符合项目的开源许可证要求。 