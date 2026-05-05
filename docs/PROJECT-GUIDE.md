# Atoms Demo — 项目说明文档

## 项目概览

Atoms 是一个 AI 驱动的 Web 应用生成平台。用户通过自然语言描述需求，系统自动生成完整的 Web 应用代码并提供实时预览。支持单工程师模式（快速生成）和团队模式（多 Agent 协作 + QA 审查）。

**技术栈**: Next.js 16 + React 19 + LangGraph + MiniMax M2.7 + esbuild + Redis + WebContainer API

---

## 一、实现思路与关键取舍

### 1.1 架构设计：LangGraph 状态机

核心生成管线基于 LangGraph 构建，是一个 10 节点的有向状态图：

```
START
  ├─ engineer 模式 → single_code → END
  └─ team 模式 → router
                    ├─ new_request → planner → code_struct / multi_file_codegen → merge → qa_reviewer → END
                    ├─ modify → modifier → qa_reviewer → END
                    └─ question → chat_agent → END
```

**关键取舍**:

| 决策 | 选择 | 放弃的方案 | 理由 |
|------|------|-----------|------|
| 管线框架 | LangGraph 状态机 | 自定义 while 循环 | 条件路由、检查点持久化、重试拓扑开箱即用 |
| LLM 后端 | MiniMax M2.7-highspeed | OpenAI GPT-4 / Claude | 国内低延迟、成本可控、150K token 上限 |
| Token 压缩 | 20k tokens触发 | 整体压缩 | 整体压缩信息丢失过多，控制每次对话存入上下文的tokens配合摘要压缩完成上下文管理 |
| 代码解析 | 三级 fallback JSON 解析 | 仅 JSON.parse | LLM 输出中常含未转义换行符，需要 `fixJsonValues` + 正则兜底 |

### 1.2 预览系统：三层架构

| 层级 | 适用场景 | 实现方式 |
|------|---------|---------|
| **esbuild 打包** | single-html / react-vite 项目 | 虚拟文件系统 + 内联打包 → 自包含 HTML → iframe 渲染 |
| **WebContainer** | react-vite 项目（可选） | 浏览器端 Vite 运行时，完整的 npm 体验 |
| **Server Runner** | fullstack 项目 | 服务器端进程管理，前后端分别启动 |

**esbuild 预览的关键设计**:
- `STUBBED_LIBS`：对 15+ 常用 npm 包提供空 stub（recharts、framer-motion、dnd-kit 等），防止未安装依赖导致构建失败
- 虚拟文件系统插件：所有文件在内存中解析，不需要写磁盘
- `stripBadImports` 插件：自动将未安装的包路由到 stub

### 1.3 存储：Redis KV + localStorage 双层

- **服务端**: `@vercel/kv`（Redis）用于项目持久化和 LangGraph 检查点
- **客户端**: localStorage 作为 fallback，当 Redis 不可用时自动切换
- **KVCheckpointer**: 将 LangGraph 的 checkpoint 存入 Redis，支持长对话恢复

### 1.4 上下文管理

LLM 对话随轮次增长会超出 token 限制，采用压缩策略：
- 当 tokens 超过 20K 阈值时，使用 LLM 对历史消息进行摘要压缩
- `trimToolCallContent`: 保留计划首尾 30% + 中间 40%，裁剪冗长的工具调用输出
- 压缩结果存入 `contextSummary` 字段，后续节点使用压缩版本

### 1.5 项目类型自动检测

通过关键词匹配 + LLM 判断两级机制：
1. 正则匹配后端关键词（`后端|backend|api|数据库|flask|fastapi` 等）→ 直接标记 fullstack
2. 关键词未命中时，调用 LLM 判断 → 输出 `simple` 或 `fullstack`

---

## 二、当前完成程度

### 与 atoms.dev（官方产品）对比

| 能力维度 | atoms.dev | 本项目 | 差距 |
|----------|-----------|--------|------|
| **Agent 数量** | 7 个（Deep Researcher、Architect、PM、Team Leader、SEO、Engineer、Data Analyst） | 4 个（Mike/Team Leader、Emma/PM、Alex/Engineer、QA） | 缺少 Deep Researcher、Architect、SEO Specialist、Data Analyst |
| **交互方式** | 对话 + 可视化拖拽编辑器（Visual Editor） | 纯对话 | 缺少 Visual Editor |
| **项目类型** | 单页 + React + Fullstack + 移动端 | single-html / react-vite / fullstack | 缺少移动端模板 |
| **后端服务** | Atoms Cloud（用户登录、数据库、Stripe 支付、API 托管） | 仅代码生成，无运行时后端 | 缺少 BaaS 能力 |
| **模型选择** | Race Mode（多模型竞赛，用户选最优） | 单一 MiniMax M2.7 | 缺少多模型支持 |
| **预览** | 实时预览 + 即时发布（自带域名） | esbuild/WebContainer/Server Runner 本地预览 | 缺少发布/托管 |
| **代码编辑** | 在线编辑器（可编辑 + 实时生效） | 只读代码展示 | 缺少在线编辑 |
| **AI 集成** | 内置 AI 功能（聊天、推荐、搜索即插即用） | 无 | 缺少 AI 组件库 |
| **部署** | 一键发布到 atoms.dev 子域名 | ZIP 下载到本地 | 缺少部署集成 |
| **协作** | 项目分享、多人协作 | 无 | 缺少分享/协作 |
| **GitHub** | 双向同步 | 无 | 缺少版本控制集成 |

### 已完成功能

| 模块 | 功能 | 状态 |
|------|------|------|
| **核心管线** | 10 节点 LangGraph 状态图 | ✅ 完成 |
| **双模式** | engineer（快速）+ team（协作） | ✅ 完成 |
| **三种项目类型** | single-html / react-vite / fullstack | ✅ 完成 |
| **Router** | 意图识别（新建/修改/提问） | ✅ 完成 |
| **Planner** | JSON 结构化规划 + 澄清问题 | ✅ 完成 |
| **CodeGen** | 150K token 限制，Tool Calling + 三级 fallback | ✅ 完成 |
| **QA Reviewer** | 自动代码审查（全文件）+ 最多 3 次重试 | ✅ 完成 |
| **Modifier** | 基于上下文的增量修改（Tool Calling） | ✅ 完成 |
| **esbuild 预览** | 虚拟 FS + STUBBED_LIBS + 内联打包 | ✅ 完成 |
| **WebContainer** | 浏览器端 Vite 运行时 | ✅ 完成（基础集成） |
| **Server Runner** | fullstack 项目服务器端运行 | ✅ 完成（基础集成） |
| **SSE 流式** | token/progress/files_generated/qa_result/build_error/batch_progress | ✅ 完成 |
| **文件树** | 多文件展示 + 点击编辑 | ✅ 完成 |
| **项目持久化** | Redis KV + localStorage fallback | ✅ 完成 |
| **上下文压缩** | LLM 摘要压缩长对话（全量内容送压缩） | ✅ 完成 |
| **Checkpointer** | LangGraph 状态持久化到 Redis（含断点恢复） | ✅ 完成 |
| **Tool Calling** | 5 个工具（write_file/create_plan/ask_clarification/report_issue/approve_code） | ✅ 完成 |
| **Mode Upgrade** | engineer → team 升级（补 planner + QA） | ✅ 完成 |
| **Showcase** | 6 个预置示例项目（AI chatbot、Dashboard 等） | ✅ 完成 |
| **下载** | ZIP 导出生成项目 | ✅ 完成 |
| **构建错误诊断** | esbuild 结构化错误 → SSE 推送到前端 | ✅ 完成 |
| **进程管理** | pm2 后台运行 + 自动重启 + 开机启动 | ✅ 完成 |

### 已知问题 / 未完成

| 问题 | 状态 | 说明 |
|------|------|------|
| WebContainer 稳定性 | ⚠️ 部分 | 依赖 CDN 加载，网络波动会导致失败 |
| Fullstack 预览 | ⚠️ 基础 | Server Runner 可启动但无热重载、无日志流 |
| 项目列表加载 | ⚠️ 可优化 | N+1 串行请求，大量项目时偏慢 |
| 用户认证 | ❌ 未做 | 无登录系统，userId 通过 cookie 生成 |
| 项目分享/协作 | ❌ 未做 | 无分享链接、无多人协作 |
| 代码编辑 | ❌ 只读 | CodeEditor 只展示不编辑 |
| 错误恢复 | ⚠️ 基础 | LLM 超时/格式错误有 fallback，但无用户重试 UI |
| 响应式设计 | ⚠️ 部分 | 主要为桌面优化，移动端体验一般 |
| Visual Editor | ❌ 未做 | 无拖拽编辑器（atoms.dev 核心差异） |
| 后端即服务 | ❌ 未做 | 无用户登录/数据库/支付集成 |
| 多模型竞赛 | ❌ 未做 | 无 Race Mode |
| 部署/托管 | ❌ 未做 | 无一键发布 |
| SEO Agent | ❌ 未做 | 无 SEO 优化能力 |
| Data Analyst Agent | ❌ 未做 | 无数据分析 Agent |

---

## 三、未来扩展路线图（按优先级）

> 基于 atoms.dev 官方产品对比，聚焦补齐核心差距

### P0 

1. **项目列表加载优化**
   - 当前: N+1 串行 API 请求 + iframe 缩略图
   - 方案: `?mode=summary` 一次返回所有列表数据，移除 iframe 改用 CSS 占位符
   - 影响: 所有用户打开 `/projects` 即刻感知

2. **代码编辑器可编辑**
   - 当前: CodeEditor 只读
   - 方案: 接入 Monaco Editor 或 CodeMirror，修改后触发重新预览
   - 影响: 用户可手动修复小问题，减少 LLM 重试；atoms.dev 的基础能力

3. **LLM 错误用户重试**
   - 当前: 生成失败只显示错误，用户需重新描述
   - 方案: 添加"重新生成"按钮，携带上次失败原因重试
   - 影响: 减少用户挫败感

### P1 

4. **对话历史恢复**
   - 当前: 刷新页面后对话历史从 KV 恢复但管线状态丢失
   - 方案: 利用 KVCheckpointer 恢复完整 LangGraph 状态，支持断点续生
   - 影响: 长对话不丢失上下文

5. **WebContainer 稳定性提升**
   - 当前: 依赖外部 CDN，加载不稳定
   - 方案: 本地缓存 WebContainer 依赖、添加加载重试、降级到 esbuild 预览
   - 影响: React 项目预览成功率提升

6. **Fullstack 项目热重载**
   - 当前: Server Runner 只启动不监听文件变化
   - 方案: 文件变更时通过 SSE 通知 Runner 重启、添加日志流
   - 影响: 全栈项目可实时预览

7. **Race Mode（多模型竞赛）**
   - 当前: 单一 MiniMax M2.7
   - 方案: 并行调用 2-3 个模型（MiniMax / DeepSeek / Qwen），展示多个结果供用户选择最优
   - 影响: atoms.dev 的核心差异化功能，提升生成质量
   - 参考: atoms.dev Race Mode

### P2

8. **用户认证**
   - 方案: NextAuth.js + GitHub/Google OAuth
   - 影响: 项目绑定真实用户，是协作和分享的前提

9. **项目分享**
   - 方案: 生成只读分享链接，访客可查看代码和预览
   - 影响: 产品可传播性

10. **Visual Editor（可视化编辑器）**
    - 当前: 纯对话交互
    - 方案: 拖拽式 UI 编辑器 + 对话生成联动（类似 atoms.dev Visual Editor）
    - 影响: atoms.dev 最大的差异化功能，降低非技术用户门槛
    - 参考: atoms.dev 可视化拖拽编辑

11. **后端即服务（BaaS）**
    - 当前: 仅代码生成，无运行时后端
    - 方案: 内置用户登录、数据库（SQLite/PostgreSQL）、Stripe 支付、API 托管
    - 影响: atoms.dev Atoms Cloud 的核心价值，让全栈项目真正可运行
    - 参考: atoms.dev 内置用户登录 + 数据库 + Stripe 支付

12. **SEO Agent**
    - 当前: 无 SEO 能力
    - 方案: 新增 SEO Specialist Agent，自动生成 meta tags、结构化数据、sitemap
    - 影响: atoms.dev 有专门的 SEO Agent

### P3 — 远期

13. **部署集成** — 一键部署到 Vercel/Cloudflare 或自有域名（atoms.dev 有即时发布）
14. **GitHub 同步** — 双向同步项目代码到 GitHub 仓库
15. **实时协作编辑** — 多人同时编辑同一项目
16. **版本控制** — 项目快照、回滚、diff 对比
17. **Data Analyst Agent** — 数据分析与可视化 Agent
18. **Deep Researcher Agent** — 深度研究 Agent，生成前调研技术方案
19. **Architect Agent** — 架构设计 Agent，负责系统架构决策
20. **AI 集成组件库** — 内置聊天、推荐、搜索等 AI 功能即插即用
21. **插件系统** — 自定义 Agent、自定义预览渲染器
22. **移动端适配** — 响应式布局优化

---

## 文件结构速览

```
atoms-demo/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # SSE 流式对话 API
│   │   ├── preview/route.ts       # 预览代理
│   │   ├── projects/route.ts      # 项目 CRUD
│   │   ├── projects/[id]/
│   │   │   ├── route.ts           # 单项目操作
│   │   │   └── build-preview/route.ts  # 构建预览 HTML
│   │   └── runner/route.ts        # Server Runner API
│   ├── explore/page.tsx           # 探索页（Showcase）
│   ├── page.tsx                   # 首页
│   ├── projects/page.tsx          # 项目列表
│   ├── project/[id]/page.tsx      # 项目编辑器（主页面）
│   └── showcase/[id]/page.tsx     # Showcase 详情
├── components/
│   ├── AgentAvatar.tsx            # Agent 头像
│   ├── AgentInfoModal.tsx         # Agent 信息弹窗
│   ├── ChatPanel.tsx              # 对话面板
│   ├── CodeEditor.tsx             # 代码编辑器
│   ├── DownloadButton.tsx         # 下载按钮
│   ├── FileTree.tsx               # 文件树
│   ├── PreviewPanel.tsx           # 预览面板
│   ├── PreviewThumbnail.tsx       # 缩略图
│   ├── Sidebar.tsx                # 侧边栏
│   ├── TabBar.tsx                 # 标签栏
│   ├── TemplateCard.tsx           # 模板卡片
│   └── TerminalPanel.tsx          # 终端面板
├── lib/
│   ├── agents.ts                  # 12 个 Agent 系统提示词
│   ├── build-preview.ts           # esbuild 打包构建
│   ├── context-manager.ts         # 上下文压缩
│   ├── fullstack-template.ts      # Fullstack 模板
│   ├── graph.ts                   # LangGraph 管线（核心）
│   ├── kv-checkpointer.ts         # Redis 检查点
│   ├── kv-storage.ts              # KV 存储层
│   ├── project-runner.ts          # Server Runner
│   ├── react-template.ts          # React 项目模板 + JSON 解析
│   ├── storage.ts                 # 项目存储
│   ├── types.ts                   # 类型定义
│   ├── webcontainer.ts            # WebContainer 集成
│   └── showcase-data/             # Showcase 示例数据
│       ├── ai-chatbot.ts
│       ├── data-dashboard.ts
│       ├── ecommerce-landing.ts
│       ├── game-landing.ts
│       ├── portfolio.ts
│       └── saas-pricing.ts
├── middleware.ts                  # Next.js 中间件
└── package.json
```

---

## 关键依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| next | 16.2.4 | 应用框架 |
| react / react-dom | 19.2.4 | UI |
| @langchain/langgraph | ^1.2.9 | 状态机管线 |
| @langchain/openai | ^1.4.5 | LLM 调用（MiniMax 兼容 OpenAI API） |
| esbuild | ^0.28.0 | 预览构建 |
| @vercel/kv | ^3.0.0 | Redis 存储 |
| @webcontainer/api | ^1.6.4 | 浏览器端 Vite |
| ioredis | ^5.10.1 | Redis 客户端 |
| jszip | ^3.10.1 | ZIP 导出 |
| tailwindcss | ^4 | 样式 |
