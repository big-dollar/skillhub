# SkillHub - 开发者 Skill 分享平台

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind">
  <img src="https://img.shields.io/badge/GitHub%20OAuth-集成-success?style=flat-square&logo=github" alt="GitHub OAuth">
  <img src="https://img.shields.io/badge/飞书-集成-blue?style=flat-square" alt="Feishu">
</p>

<p align="center">
  <strong>一个优雅、轻量的开发者知识库平台</strong><br>
  浏览、分享并发现优质的开发 skill、patterns 与架构指南
</p>

---

## ✨ 核心功能

### 🔍 智能搜索与排序
- **全文搜索**：支持按标题、描述、标签搜索 skill
- **多维排序**：点赞最多、最新发布、下载最多
- **实时过滤**：即时展示搜索结果

### 👤 多平台登录集成
- **GitHub 登录**：使用 GitHub 账号快速登录
- **飞书登录**：支持飞书企业账号登录
- **真实身份**：显示用户头像和姓名
- **安全可靠**：基于 OAuth 2.0 标准协议

### 📦 Skill 上传与分享
- **ZIP 上传**：支持上传包含 `SKILL.md` 的压缩包
- **自动解析**：自动提取 skill 元数据和文档
- **README 生成**：智能生成 skill 介绍文档
- **版本管理**：支持 skill 版本号管理

### ❤️ 社区互动
- **点赞系统**：为喜欢的 skill 点赞
- **下载统计**：记录每个 skill 的下载次数
- **作者展示**：显示上传者 GitHub 信息和头像

---

## 🏗️ 技术架构

### 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.1.7 | React 框架，支持 App Router |
| **React** | 19.2.3 | UI 组件库 |
| **TypeScript** | 5.x | 类型安全开发 |
| **Tailwind CSS** | 4.x | 原子化 CSS 框架 |

### 后端技术栈
| 技术 | 用途 |
|------|------|
| **Next.js API Routes** | RESTful API 服务端 |
| **GitHub OAuth** | GitHub 认证授权 |
| **飞书 OAuth** | 飞书认证授权 |
| **JSON 文件存储** | 轻量级数据持久化 |
| **Adm-Zip** | ZIP 文件解析处理 |

### 项目结构
```
skillhub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证相关
│   │   │   │   ├── callback/
│   │   │   │   │   ├── github/       # GitHub OAuth 回调
│   │   │   │   │   └── feishu/       # 飞书 OAuth 回调
│   │   │   │   ├── login/            # GitHub 登录跳转
│   │   │   │   ├── feishu-login/     # 飞书登录跳转
│   │   │   │   └── logout/           # 退出登录
│   │   │   └── skills/        # Skill API
│   │   │       ├── [id]/
│   │   │       │   ├── download/     # 下载接口
│   │   │       │   └── like/         # 点赞接口
│   │   │       └── upload/           # 上传接口
│   │   ├── page.tsx           # 首页
│   │   ├── upload/page.tsx    # 上传页
│   │   └── skills/[slug]/     # Skill 详情页
│   ├── components/            # React 组件
│   │   ├── auth/             # 认证组件
│   │   ├── layout/           # 布局组件
│   │   └── skills/           # Skill 组件
│   └── lib/                   # 工具库
│       ├── auth/             # 认证逻辑
│       ├── skills/           # Skill 数据层
│       └── ingestion/        # 上传处理
├── tests/                     # 测试文件
├── data/                      # 数据存储目录
└── public/                    # 静态资源
```

---

## 🚀 快速开始

### 环境要求
- Node.js 20+
- pnpm 9+

### 1. 克隆项目
```bash
git clone https://github.com/big-dollar/skillhub.git
cd skillhub
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 配置环境变量
复制 `.env.example` 为 `.env.local`：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 填入你的 OAuth 配置：
```bash
# GitHub OAuth 配置
# 1. 访问 https://github.com/settings/applications/new
# 2. 创建 OAuth App，回调地址填：http://localhost:3000/api/auth/callback/github
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# 飞书 OAuth 配置（可选）
# 1. 访问 https://open.feishu.cn/app
# 2. 创建应用并开启"Authen"权限
# 3. 设置回调地址：http://localhost:3000/api/auth/callback/feishu
FEISHU_APP_ID=your_feishu_app_id
FEISHU_APP_SECRET=your_feishu_app_secret

# 应用地址
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000 即可使用。

### 5. 构建生产版本
```bash
pnpm build
pnpm start
```

---

## 🧪 测试

项目包含完整的测试套件：

```bash
# 运行所有测试
pnpm test:run

# 开发模式运行测试
pnpm test

# 代码检查
pnpm lint
```

测试覆盖：
- ✅ 认证流程测试
- ✅ Skill 数据层测试
- ✅ API 集成测试
- ✅ ZIP 解析测试

---

## 📝 Skill 上传规范

### ZIP 包结构
```
your-skill.zip
├── SKILL.md          # 必须：skill 文档
├── README.md         # 可选：详细说明
└── ...               # 其他资源文件
```

### SKILL.md 示例
```markdown
# React Server Components Mastery

学习 Next.js App Router 中 React Server Components 的生产级模式。

## 使用场景

- 大型内容密集型应用
- 流式优先的用户体验
- 减少客户端包体积

## 安装

将 skill 文件夹复制到工作区并按照示例操作。
```

---

## 🔒 安全特性

- **CSRF 防护**：OAuth state 参数验证
- **HttpOnly Cookie**：Session 安全存储
- **SameSite 策略**：防止跨站请求伪造
- **输入验证**：ZIP 文件安全检查
- **路径安全**：防止目录遍历攻击

---

## 🎯 适用场景

- **个人开发者**：整理和分享自己的技术经验
- **技术团队**：建立内部知识库和最佳实践
- **开源社区**：分享可复用的开发模式和组件
- **学习交流**：发现和学习他人的优秀实践

---

## 📊 性能特点

- **轻量级**：无数据库依赖，JSON 文件存储
- **快速响应**：Next.js 服务端渲染
- **低资源占用**：适合小团队和个人部署
- **并发友好**：支持 < 50 并发用户

---

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

---

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源。

---

## 💡 灵感来源

本项目受 [ClawHub](https://clawhub.ai) 启发，致力于为开发者打造一个简洁、优雅的 skill 分享平台。

---

<p align="center">
  用 ❤️ 和 ☕ 为开发者社区而建
</p>
