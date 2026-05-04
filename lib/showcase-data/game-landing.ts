import { ProjectFile, Message } from '../types';

const APP_JSX = `import { useState } from 'react';

const features = [
  { icon: '🌌', title: '开放宇宙', bgClass: 'bg-amber-500/10', desc: '超过 10000 个可探索星系，每个星系都有独特的生态和资源，从繁华的贸易枢纽到荒凉的边境星球。' },
  { icon: '⚔️', title: '史诗战斗', bgClass: 'bg-red-500/10', desc: '万人同屏太空大战，策略与操作的完美结合，指挥你的舰队征服星系。' },
  { icon: '🏗️', title: '自由建造', bgClass: 'bg-blue-500/10', desc: '建造你的太空基地，设计独一无二的战舰，从蓝图到现实只差你的想象力。' },
  { icon: '🤝', title: '社交系统', bgClass: 'bg-green-500/10', desc: '组建联盟，与好友一起征服星系，实时语音协作，建立你的星际帝国。' },
  { icon: '🎯', title: '竞技排位', bgClass: 'bg-purple-500/10', desc: '公平竞技，用实力证明你的战略天赋，赛季排名赢取稀有奖励。' },
  { icon: '📖', title: '沉浸剧情', bgClass: 'bg-amber-500/10', desc: '百万字原创剧情，多线结局由你选择，每一个决定都将改变星系的命运。' },
];

const characters = [
  { name: '影刃·K', role: '刺客', color: 'from-red-600 to-orange-600', icon: '🗡️', shadow: 'red' },
  { name: '星辰·Luna', role: '法师', color: 'from-purple-600 to-blue-600', icon: '🔮', shadow: 'purple' },
  { name: '铁壁·Atlas', role: '坦克', color: 'from-amber-600 to-yellow-600', icon: '🛡️', shadow: 'amber' },
  { name: '幻影·Echo', role: '射手', color: 'from-emerald-600 to-teal-600', icon: '🏹', shadow: 'emerald' },
];

export default function App() {
  const [email, setEmail] = useState('');
  const [reserved, setReserved] = useState(false);

  const handleReserve = () => {
    if (email.includes('@')) {
      setReserved(true);
    }
  };

  return (
    <div className="bg-gray-950 text-white overflow-x-hidden">

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/40 via-gray-950 to-gray-950" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/5 w-80 h-80 rounded-full bg-orange-600/15 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-red-500/10 blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />

        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-amber-400 text-sm tracking-widest uppercase font-medium">2024 年度期待大作</p>
          </div>

          <h1 className="text-8xl font-black mb-4 leading-none bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
            星际征途
          </h1>
          <p className="text-2xl text-gray-400 mb-4 tracking-[0.3em] font-light">STELLAR ODYSSEY</p>
          <p className="text-gray-500 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
            探索无尽星系，书写属于你的传奇。万人同屏，史诗级太空战斗。
          </p>

          <div className="flex gap-5 justify-center flex-wrap">
            <button className="group relative bg-gradient-to-r from-amber-500 to-orange-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 transition-all duration-300">
              <span className="relative z-10">立即预约</span>
            </button>
            <button className="border border-gray-600 text-gray-300 px-10 py-4 rounded-2xl font-medium text-lg hover:border-amber-500/50 hover:text-amber-300 transition-all duration-300 backdrop-blur-sm bg-white/5">
              观看预告片 ▶
            </button>
          </div>

          <div className="mt-16 flex gap-10 justify-center">
            <div className="text-center">
              <span className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent block mb-1">2M+</span>
              <span className="text-sm text-gray-500">预约玩家</span>
            </div>
            <div className="w-px bg-gray-800" />
            <div className="text-center">
              <span className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent block mb-1">4.9</span>
              <span className="text-sm text-gray-500">测试评分</span>
            </div>
            <div className="w-px bg-gray-800" />
            <div className="text-center">
              <span className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent block mb-1">2024</span>
              <span className="text-sm text-gray-500">公测年份</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
          <span className="text-xs tracking-widest uppercase">向下探索</span>
          <div className="w-5 h-8 rounded-full border border-gray-700 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-amber-500 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900/50 to-gray-950" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-500 text-sm tracking-widest uppercase mb-3">GAME FEATURES</p>
            <h2 className="text-4xl font-black mb-4">游戏特色</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group bg-gray-900/80 border border-gray-800 rounded-2xl p-8 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10">
                <div className={\`w-14 h-14 rounded-xl \${f.bgClass} flex items-center justify-center text-3xl mb-5\`}>{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Characters */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-amber-950/10 to-gray-950" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-500 text-sm tracking-widest uppercase mb-3">LEGENDARY HEROES</p>
            <h2 className="text-4xl font-black mb-4">传奇角色</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {characters.map((c, i) => (
              <div key={i} className="group cursor-pointer">
                <div className={\`bg-gradient-to-br \${c.color} rounded-2xl h-56 flex items-center justify-center mb-4 group-hover:scale-105 transition-all duration-300 relative overflow-hidden\`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <span className="text-6xl relative z-10 drop-shadow-lg">{c.icon}</span>
                  <div className="absolute bottom-3 right-3 text-xs font-bold bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">SSR</div>
                </div>
                <h3 className="font-bold text-lg mb-1">{c.name}</h3>
                <p className="text-sm text-gray-500">● {c.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900/50 to-gray-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">准备好开启星际征程了吗？</h2>
          <p className="text-gray-400 mb-10 text-lg">预约即送限定战舰皮肤 + 1000 星币</p>
          {reserved ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-8 py-6 max-w-md mx-auto">
              <p className="text-amber-400 text-xl font-bold mb-2">预约成功！</p>
              <p className="text-gray-400 text-sm">我们会在公测时通知 {email}</p>
            </div>
          ) : (
            <div className="flex gap-3 justify-center flex-wrap">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="输入邮箱预约"
                className="bg-gray-900/80 border border-gray-700 rounded-xl px-6 py-4 text-sm w-80 focus:outline-none focus:border-amber-500 transition-all placeholder-gray-600 backdrop-blur-sm"
              />
              <button onClick={handleReserve} className="bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 px-8 py-4 rounded-xl font-bold hover:from-amber-400 hover:to-orange-400 transition-all duration-300 shadow-lg shadow-amber-500/20">
                立即预约
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <span className="font-bold text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">STELLAR ODYSSEY</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-amber-400 transition-colors">关于我们</a>
            <a href="#" className="hover:text-amber-400 transition-colors">用户协议</a>
            <a href="#" className="hover:text-amber-400 transition-colors">隐私政策</a>
          </div>
          <p className="text-sm text-gray-600">&copy; 2024 Stellar Odyssey. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
`;

const baseFiles = {
  pkg: JSON.stringify({
    name: 'game-landing', private: true, version: '0.0.1', type: 'module',
    scripts: { dev: 'vite', build: 'vite build' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1', 'lucide-react': '^0.468.0' },
    devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.0', '@tailwindcss/vite': '^4.0.0', tailwindcss: '^4.0.0' },
  }, null, 2),
  vite: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport tailwindcss from '@tailwindcss/vite';\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  server: { headers: { 'Cross-Origin-Resource-Policy': 'cross-origin' } },\n});\n`,
  html: '<!DOCTYPE html>\n<html lang="zh-CN">\n  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>星际征途</title></head>\n  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>\n</html>',
  main: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);\n`,
  css: '@import "tailwindcss";\n',
};

export const gameLandingFiles: ProjectFile[] = [
  { path: 'package.json', content: baseFiles.pkg, language: 'json' },
  { path: 'vite.config.js', content: baseFiles.vite, language: 'javascript' },
  { path: 'index.html', content: baseFiles.html, language: 'html' },
  { path: 'src/main.jsx', content: baseFiles.main, language: 'javascript' },
  { path: 'src/index.css', content: baseFiles.css, language: 'css' },
  { path: 'src/App.jsx', content: APP_JSX, language: 'javascript' },
];

export const gameLandingMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: '创建一个游戏宣传落地页，包含全屏Hero区、游戏特色介绍、角色展示区和下载按钮',
    timestamp: '2024-12-01T11:00:00.000Z',
  },
  {
    id: 'msg-2',
    role: 'mike',
    content: '这是一个游戏宣传页面需求，视觉冲击力很重要。我来安排团队：\n\n1. **Emma** 规划页面结构和视觉层次\n2. **Alex** 实现全屏 Hero + 动态光效 + 角色卡片\n3. **QA** 检查交互和动画效果\n\n开始处理...',
    timestamp: '2024-12-01T11:00:02.000Z',
    type: 'text',
    summary: 'Mike 路由：游戏宣传页，注重视觉效果',
  },
  {
    id: 'msg-3',
    role: 'emma',
    content: '## 游戏落地页结构规划\n\n### 视觉风格\n- 深色主题（gray-950），amber/orange 暖色调\n- 大量使用渐变、发光效果、模糊背景\n- 全屏 Hero 是核心\n\n### 页面模块\n1. **Hero**（全屏）— 游戏名「星际征途」+ 英文副标题 + 预约按钮 + 数据统计（2M+ 预约/4.9 评分）\n2. **Features**（6 宫格）— 开放宇宙、史诗战斗、自由建造、社交系统、竞技排位、沉浸剧情\n3. **Characters**（4 列）— 角色卡片，渐变背景 + SSR 标签 + 悬停放大\n4. **CTA**（邮箱预约）— 输入框 + 预约按钮\n5. **Footer** — 品牌信息 + 链接\n\n### 动效\n- 背景光球 pulse 动画\n- 角色卡片悬停 scale 效果\n- 滚动指示器 bounce',
    timestamp: '2024-12-01T11:00:06.000Z',
    type: 'text',
    summary: 'Emma 规划：全屏 Hero + 6 特色 + 4 角色 + CTA 预约',
  },
  {
    id: 'msg-4',
    role: 'alex',
    content: '游戏宣传页「星际征途」已完成。\n\n主要实现：\n- **Hero**: 全屏渐变背景 + 动态光球（blur + pulse），标题使用 bg-clip-text 渐变文字\n- **Features**: 6 个特色卡片，网格布局，悬停上浮 + 发光边框\n- **Characters**: 4 个 SSR 角色卡片，渐变背景 + 悬停放大\n- **CTA**: 邮箱输入 + 预约按钮，中心发光效果\n- **Footer**: 响应式布局\n\n使用 useState 管理邮箱输入，数据驱动渲染特色和角色列表。',
    timestamp: '2024-12-01T11:00:20.000Z',
    type: 'text',
    summary: 'Alex 生成：星际征途游戏宣传页，含全屏 Hero + 动效',
    toolName: 'multi_file_codegen',
  },
  {
    id: 'msg-5',
    role: 'qa',
    content: '✅ QA 检查通过。\n\n- ✅ 全屏 Hero 布局正确，渐变文字清晰\n- ✅ 动画效果流畅（pulse, bounce）\n- ✅ 角色卡片悬停交互正常\n- ✅ 邮箱输入受控组件\n- ✅ 数据数组驱动渲染\n- ✅ 深色主题对比度足够',
    timestamp: '2024-12-01T11:00:23.000Z',
    type: 'tool_call',
    summary: 'QA 检查通过，动效和交互正常',
    toolName: 'qa_reviewer',
  },
];

export const gameLandingHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>星际征途</title>
  <script src="/tailwind.js"></script>
</head>
<body class="bg-gray-950 text-white">
  <section class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-amber-950/40 via-gray-950 to-gray-950"></div>
    <div class="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl"></div>
    <div class="absolute bottom-1/3 left-1/5 w-80 h-80 rounded-full bg-orange-600/15 blur-3xl"></div>
    <div class="relative z-10 text-center px-6 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10">
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <p class="text-amber-400 text-sm tracking-widest uppercase">2024 年度期待大作</p>
      </div>
      <h1 class="text-8xl font-black mb-4 leading-none bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text text-transparent">星际征途</h1>
      <p class="text-2xl text-gray-400 mb-4 tracking-[0.3em]">STELLAR ODYSSEY</p>
      <p class="text-gray-500 mb-10 max-w-lg mx-auto text-lg">探索无尽星系，书写属于你的传奇。</p>
      <div class="flex gap-5 justify-center">
        <button class="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-lg">立即预约</button>
        <button class="border border-gray-600 text-gray-300 px-10 py-4 rounded-2xl text-lg">观看预告片 ▶</button>
      </div>
      <div class="mt-16 flex gap-10 justify-center">
        <div class="text-center"><span class="text-4xl font-black text-amber-400 block">2M+</span><span class="text-sm text-gray-500">预约玩家</span></div>
        <div class="w-px bg-gray-800"></div>
        <div class="text-center"><span class="text-4xl font-black text-amber-400 block">4.9</span><span class="text-sm text-gray-500">测试评分</span></div>
      </div>
    </div>
  </section>
</body>
</html>`;
