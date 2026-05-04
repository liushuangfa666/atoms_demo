import { ProjectFile, Message } from '../types';

const APP_JSX = `import { useState } from 'react';

const conversations = [
  { id: '1', title: '智能手表咨询', time: '刚刚', active: true },
  { id: '2', title: '订单物流查询', time: '10:30', active: false },
  { id: '3', title: '退换货流程', time: '昨天', active: false },
  { id: '4', title: '会员积分兑换', time: '昨天', active: false },
  { id: '5', title: '优惠券使用', time: '周一', active: false },
];

const initialMessages = [
  { id: 'm1', role: 'ai', content: '你好！我是 AI 智能客服小助手，很高兴为您服务。请问有什么可以帮您的？' },
  { id: 'm2', role: 'user', content: '我想了解一下你们最新的智能手表有哪些功能？' },
  { id: 'm3', role: 'ai', content: '我们最新款智能手表具有以下核心功能：\\n\\n1. **健康监测** — 实时心率、血氧、睡眠质量追踪\\n2. **运动模式** — 支持 100+ 种运动模式，自动识别\\n3. **智能通知** — 来电、短信、App 消息实时推送\\n4. **NFC 支付** — 支持支付宝、微信离线支付\\n5. **超长续航** — 典型场景 14 天超长续航\\n\\n您对哪个功能最感兴趣呢？' },
  { id: 'm4', role: 'user', content: 'NFC 支付怎么开通？需要额外收费吗？' },
  { id: 'm5', role: 'ai', content: 'NFC 支付开通非常简单，完全免费：\\n\\n1. 打开手表的「钱包」应用\\n2. 选择「添加银行卡」或「绑定支付账户」\\n3. 按照提示完成身份验证即可\\n\\n使用时只需抬腕靠近 POS 机，无需手机即可完成支付。目前支持银联、支付宝和微信三种支付方式。' },
];

export default function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [activeConversationId, setActiveConversationId] = useState('1');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: '感谢您的咨询，我正在为您查询相关信息，请稍等...' }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r flex flex-col">
        <div className="p-5 border-b">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-white text-sm">AI</div>
            <span className="font-bold text-gray-800">AI 智能客服</span>
          </div>
          <button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition">
            + 新对话
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={\`px-5 py-3.5 cursor-pointer transition \${activeConversationId === conv.id ? 'bg-pink-50 border-l-4 border-pink-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}\`}
            >
              <p className={\`text-sm font-medium truncate \${activeConversationId === conv.id ? 'text-pink-700' : 'text-gray-700'}\`}>{conv.title}</p>
              <p className="text-xs text-gray-400 mt-1">{conv.time}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white text-sm font-medium">U</div>
          <div>
            <p className="text-sm font-medium text-gray-700">用户</p>
            <p className="text-xs text-gray-400">在线</p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white">AI</div>
            <div>
              <p className="font-medium text-gray-800">AI 智能客服</p>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span> 在线
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">对话 1/5</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white text-xs mr-3 shrink-0 mt-1">AI</div>
              )}
              <div className={\`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line \${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-sm'
                  : 'bg-white text-gray-700 shadow-sm rounded-bl-sm'
              }\`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white text-xs ml-3 shrink-0 mt-1">U</div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white text-xs mr-3 shrink-0 mt-1">AI</div>
              <div className="bg-white px-5 py-3.5 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="bg-white border-t px-6 py-4">
          <div className="flex items-center gap-3">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="输入您的问题..."
              className="flex-1 bg-gray-100 rounded-full px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-300 transition"
            />
            <button
              onClick={handleSend}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95l13.56-4.26a.75.75 0 0 0 0-1.442L3.105 2.289Z" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
`;

export const aiChatbotFiles: ProjectFile[] = [
  { path: 'package.json', content: JSON.stringify({
    name: 'ai-chatbot', private: true, version: '0.0.1', type: 'module',
    scripts: { dev: 'vite', build: 'vite build' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1', 'lucide-react': '^0.468.0' },
    devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.0', '@tailwindcss/vite': '^4.0.0', tailwindcss: '^4.0.0' },
  }, null, 2), language: 'json' },
  { path: 'vite.config.js', content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport tailwindcss from '@tailwindcss/vite';\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  server: { headers: { 'Cross-Origin-Resource-Policy': 'cross-origin' } },\n});\n`, language: 'javascript' },
  { path: 'index.html', content: '<!DOCTYPE html>\n<html lang="zh-CN">\n  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>AI 智能客服</title></head>\n  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>\n</html>', language: 'html' },
  { path: 'src/main.jsx', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);\n`, language: 'javascript' },
  { path: 'src/index.css', content: '@import "tailwindcss";\n', language: 'css' },
  { path: 'src/App.jsx', content: APP_JSX, language: 'javascript' },
];

export const aiChatbotMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: '创建一个AI客服聊天界面，包含侧边栏（对话列表）、主聊天区域（消息气泡，区分用户和AI）、输入框和发送按钮',
    timestamp: '2024-12-01T11:00:00.000Z',
  },
  {
    id: 'msg-2',
    role: 'mike',
    content: '收到需求，这是一个 AI 客服聊天界面项目。我将为你启动团队协作流程：\n\n1. **Emma** 负责页面结构规划\n2. **Alex** 负责组件开发和代码生成\n3. **QA** 负责最终质量检查\n\n开始处理...',
    timestamp: '2024-12-01T11:00:02.000Z',
    type: 'text',
    summary: 'Mike 路由分析：AI 聊天界面新需求，启动团队流程',
  },
  {
    id: 'msg-3',
    role: 'emma',
    content: '## 页面结构规划\n\n这是一个 AI 客服聊天界面，需要以下模块：\n\n### 组件拆分\n- **Sidebar** — 品牌标识 + 新对话按钮 + 对话列表（5 条，支持选中态）+ 用户信息\n- **ChatArea** — 顶部 AI 状态栏 + 消息列表（用户/AI 气泡区分）+ 输入发送栏\n\n### 数据结构\n- conversations 数组：id, title, time\n- messages 数组：id, role, content\n- useState 管理：messages, inputValue, activeConversationId\n\n### 设计风格\n- 主色调：pink/rose 渐变色系\n- 白色侧边栏 + 灰色聊天背景\n- 用户消息右对齐 pink 渐变，AI 消息左对齐白色背景\n- 打字动画指示器',
    timestamp: '2024-12-01T11:00:05.000Z',
    type: 'text',
    summary: 'Emma 规划：Sidebar 对话列表 + Chat 消息气泡 + Input 发送栏',
  },
  {
    id: 'msg-4',
    role: 'alex',
    content: 'AI 客服聊天界面已生成完成。\n\n主要实现：\n- **Sidebar**: AI 智能客服品牌标识 + 新对话按钮 + 5 条对话列表（支持选中高亮）+ 用户头像\n- **ChatArea**: 顶部 AI 在线状态栏 + 消息列表（AI 问候 → 用户询问智能手表 → AI 列出功能 → 用户问支付 → AI 解答）\n- **InputBar**: 圆角输入框 + 渐变发送按钮，支持 Enter 发送\n\n使用 useState 管理消息数组 messages、输入值 inputValue、当前活跃对话 activeConversationId，支持发送新消息并模拟 AI 回复，包含打字指示器动画。',
    timestamp: '2024-12-01T11:00:15.000Z',
    type: 'text',
    summary: 'Alex 生成：完整的 AI 客服聊天界面 React 组件',
    toolName: 'multi_file_codegen',
  },
  {
    id: 'msg-5',
    role: 'qa',
    content: 'QA 检查通过，代码质量良好。\n\n检查项目：\n- React 组件结构完整，使用 useState 管理消息、输入值、活跃对话\n- Tailwind CSS 类名使用规范，pink/rose 渐变配色一致\n- 用户消息与 AI 消息视觉区分明确（右/左对齐、渐变/白色背景）\n- 打字指示器动画实现正确\n- 消息发送逻辑完整，支持键盘 Enter 和按钮点击',
    timestamp: '2024-12-01T11:00:18.000Z',
    type: 'tool_call',
    summary: 'QA 检查通过',
    toolName: 'qa_reviewer',
  },
];

export const aiChatbotHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI 智能客服</title>
  <script src="/tailwind.js"></script>
</head>
<body class="flex h-screen bg-gray-100">
  <aside class="w-64 bg-white border-r flex flex-col">
    <div class="p-5 border-b">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-white text-sm">AI</div>
        <span class="font-bold text-gray-800">AI 智能客服</span>
      </div>
      <button class="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-lg text-sm">+ 新对话</button>
    </div>
    <div class="flex-1">
      <div class="px-5 py-3 bg-pink-50 border-l-4 border-pink-500 cursor-pointer">
        <p class="text-sm font-medium text-pink-700">智能手表咨询</p><p class="text-xs text-gray-400">刚刚</p>
      </div>
      <div class="px-5 py-3 cursor-pointer hover:bg-gray-50 border-l-4 border-transparent">
        <p class="text-sm text-gray-700">订单物流查询</p><p class="text-xs text-gray-400">10:30</p>
      </div>
      <div class="px-5 py-3 cursor-pointer hover:bg-gray-50 border-l-4 border-transparent">
        <p class="text-sm text-gray-700">退换货流程</p><p class="text-xs text-gray-400">昨天</p>
      </div>
    </div>
    <div class="p-4 border-t flex items-center gap-3">
      <div class="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white text-xs">U</div>
      <p class="text-sm font-medium text-gray-700">用户</p>
    </div>
  </aside>
  <main class="flex-1 flex flex-col">
    <div class="bg-white border-b px-6 py-3 flex items-center gap-3">
      <div class="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white text-xs">AI</div>
      <div><p class="font-medium text-gray-800">AI 智能客服</p><p class="text-xs text-green-500">在线</p></div>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-3">
      <div class="flex justify-start">
        <div class="w-7 h-7 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white text-xs mr-2 mt-1">AI</div>
        <div class="bg-white px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm text-sm text-gray-700 max-w-xs">你好！我是 AI 智能客服，请问有什么可以帮您的？</div>
      </div>
      <div class="flex justify-end">
        <div class="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm max-w-xs">我想了解最新的智能手表有哪些功能？</div>
        <div class="w-7 h-7 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white text-xs ml-2 mt-1">U</div>
      </div>
      <div class="flex justify-start">
        <div class="w-7 h-7 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white text-xs mr-2 mt-1">AI</div>
        <div class="bg-white px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm text-sm text-gray-700 max-w-xs">1. 健康监测 2. 运动模式 3. 智能通知 4. NFC 支付 5. 超长续航</div>
      </div>
    </div>
    <div class="bg-white border-t px-6 py-3 flex items-center gap-3">
      <input placeholder="输入您的问题..." class="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none">
      <button class="bg-gradient-to-r from-pink-500 to-rose-500 text-white w-9 h-9 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95l13.56-4.26a.75.75 0 0 0 0-1.442L3.105 2.289Z"/></svg>
      </button>
    </div>
  </main>
</body>
</html>`;
