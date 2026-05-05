# Atoms Demo

AI 驱动的 Web 应用生成平台。用户通过自然语言描述需求，系统自动生成完整的 Web 应用代码并提供实时预览。

## 功能特性

- **双模式生成**：engineer 模式（快速生成）和 team 模式（多 Agent 协作 + QA 审查）
- **多项目类型**：single-html / react-vite / fullstack 自动检测
- **4 个 Agent 协作**：Team Leader（路由）、PM（规划）、Engineer（代码生成）、QA（代码审查）
- **实时预览**：esbuild 内存打包 + WebContainer 浏览器端运行时 + Server Runner
- **Tool Calling**：write_file / create_plan / ask_clarification / report_issue / approve_code
- **上下文压缩**：LLM 摘要压缩长对话，支持 150K token 上下文
- **流式输出**：SSE 推送 token/progress/文件生成/QA 结果/构建错误
- **项目持久化**：Redis KV + localStorage 双层存储
- **Showcase**：6 个预置示例项目
- **ZIP 导出**：一键下载生成项目

## 技术栈

Next.js 16 · React 19 · LangGraph · MiniMax M2.7 · esbuild · Redis · WebContainer API

## 快速开始

### 环境要求

- Node.js 18+
- Redis（可选，不可用时自动降级到 localStorage）

### 安装

```bash
npm install
```

### 配置

在项目根目录创建 `.env.local`：

```env
MINIMAX_API_KEY=your_minimax_api_key
REDIS_URL=redis://localhost:6379    # 可选
```

### 启动开发服务

```bash
npm run dev
```

访问 http://localhost:3000

### 生产部署（pm2）

```bash
npm run build
pm2 start npm --name atoms -- start
pm2 save
pm2 startup    # 开机自启
```

## 项目结构

```
app/
  api/chat/route.ts          # SSE 流式对话 API
  api/projects/              # 项目 CRUD + 构建预览
  project/[id]/page.tsx      # 项目编辑器（主页面）
  explore/page.tsx           # 探索页（Showcase）
  projects/page.tsx          # 项目列表
components/
  ChatPanel.tsx              # 对话面板
  CodeEditor.tsx             # 代码编辑器
  PreviewPanel.tsx           # 预览面板
  FileTree.tsx               # 文件树
lib/
  graph.ts                   # LangGraph 管线（核心）
  agents.ts                  # Agent 提示词 + Tool 定义
  build-preview.ts           # esbuild 打包构建
  context-manager.ts         # 上下文压缩
  kv-checkpointer.ts         # Redis 检查点
  kv-storage.ts              # KV 存储层
  types.ts                   # 类型定义
```

## 详细文档

完整的项目说明、完成程度和路线图见 [docs/PROJECT-GUIDE.md](docs/PROJECT-GUIDE.md)。
