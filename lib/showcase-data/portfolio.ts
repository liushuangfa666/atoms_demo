import { ProjectFile, Message } from '../types';

const APP_JSX = `import { useState } from 'react';

const skills = [
  { name: 'React', level: 95, color: 'bg-indigo-500' },
  { name: 'TypeScript', level: 90, color: 'bg-purple-500' },
  { name: 'Node.js', level: 88, color: 'bg-green-500' },
  { name: 'Python', level: 82, color: 'bg-yellow-500' },
  { name: 'Next.js', level: 92, color: 'bg-indigo-400' },
  { name: 'PostgreSQL', level: 78, color: 'bg-blue-500' },
  { name: 'Docker', level: 75, color: 'bg-cyan-500' },
  { name: 'Figma', level: 70, color: 'bg-pink-500' },
];

const projects = [
  { title: 'E-Commerce Platform', desc: 'Full-stack online store with payment integration', tags: ['React', 'Node.js', 'Stripe'], gradient: 'from-indigo-600 to-purple-600' },
  { title: 'AI Dashboard', desc: 'Real-time analytics dashboard with ML predictions', tags: ['Next.js', 'Python', 'TensorFlow'], gradient: 'from-purple-600 to-pink-600' },
  { title: 'DevOps Toolkit', desc: 'CI/CD pipeline management and monitoring tool', tags: ['Docker', 'Go', 'PostgreSQL'], gradient: 'from-cyan-600 to-blue-600' },
  { title: 'Design System', desc: 'Component library with accessibility-first approach', tags: ['TypeScript', 'Figma', 'Storybook'], gradient: 'from-pink-600 to-rose-600' },
];

const navLinks = ['About', 'Skills', 'Projects', 'Contact'];

export default function App() {
  const [activeSection, setActiveSection] = useState('About');

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AC</div>
          <div className="flex gap-6 text-sm text-gray-400">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => setActiveSection(link)}
                className={\`hover:text-white transition \${
                  activeSection === link ? 'text-white' : ''
                }\`}
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold mb-6 ring-4 ring-indigo-500/20">
            A
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Hi, I'm <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Alex Chen</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mb-8">
            Full-stack developer crafting beautiful, performant web experiences.
            Passionate about clean code, modern UI, and open source.
          </p>
          <div className="flex gap-4">
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-lg font-medium hover:from-indigo-500 hover:to-purple-500 transition">
              View Projects
            </button>
            <button className="border border-gray-700 px-6 py-3 rounded-lg font-medium text-gray-300 hover:border-gray-500 hover:text-white transition">
              Get in Touch
            </button>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Skills & <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Expertise</span>
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {skills.map((skill) => (
              <div key={skill.name} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-gray-400 text-sm">{skill.level}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={\`h-full rounded-full \${skill.color} transition-all duration-1000\`}
                    style={{ width: \`\${skill.level}%\` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Featured <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Projects</span>
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {projects.map((project) => (
              <div
                key={project.title}
                className="group rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition cursor-pointer"
              >
                <div className={\`bg-gradient-to-br \${project.gradient} h-44 flex items-center justify-center\`}>
                  <span className="text-5xl opacity-60 group-hover:opacity-80 transition">📁</span>
                </div>
                <div className="p-5 bg-gray-900">
                  <h3 className="text-lg font-bold mb-1">{project.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{project.desc}</p>
                  <div className="flex gap-2 flex-wrap">
                    {project.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Let's <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Connect</span>
          </h2>
          <p className="text-gray-400 mb-8">
            Interested in working together? Feel free to reach out.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 rounded-lg font-medium hover:from-indigo-500 hover:to-purple-500 transition">
              Send Message
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-sm text-gray-500">
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-bold">AC</span>
          <span>&copy; 2024 Alex Chen. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
`;

export const portfolioFiles: ProjectFile[] = [
  {
    path: 'package.json',
    content: JSON.stringify(
      {
        name: 'portfolio-site',
        private: true,
        version: '0.0.1',
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build' },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.3.4',
          vite: '^6.0.0',
          '@tailwindcss/vite': '^4.0.0',
          tailwindcss: '^4.0.0',
        },
      },
      null,
      2
    ),
    language: 'json',
  },
  {
    path: 'vite.config.js',
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { headers: { 'Cross-Origin-Resource-Policy': 'cross-origin' } },
});
`,
    language: 'javascript',
  },
  {
    path: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Alex Chen - Portfolio</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>
</html>`,
    language: 'html',
  },
  {
    path: 'src/main.jsx',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
`,
    language: 'javascript',
  },
  {
    path: 'src/index.css',
    content: '@import "tailwindcss";\n',
    language: 'css',
  },
  {
    path: 'src/App.jsx',
    content: APP_JSX,
    language: 'javascript',
  },
];

export const portfolioMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content:
      '创建一个个人作品集网站，包含导航栏、Hero区域（头像+简介）、技能展示、项目作品网格（4个项目）和联系方式',
    timestamp: '2024-12-15T14:00:00.000Z',
  },
  {
    id: 'msg-2',
    role: 'mike',
    content:
      '收到需求，这是一个全新的个人作品集网站项目。我将为你启动团队协作流程：\n\n1. **Emma** 负责页面结构规划\n2. **Alex** 负责组件开发和代码生成\n3. **QA** 负责最终质量检查\n\n开始处理...',
    timestamp: '2024-12-15T14:00:02.000Z',
    type: 'text',
    summary: 'Mike 路由分析：新需求，启动团队流程',
  },
  {
    id: 'msg-3',
    role: 'emma',
    content:
      '## 页面结构规划\n\n这是一个暗色主题个人作品集网站，需要以下模块：\n\n### 组件拆分\n- **Nav** — 固定顶部导航，"AC" Logo + 4个锚点链接（About/Skills/Projects/Contact），使用 useState 管理激活状态\n- **Hero** — 居中布局，渐变圆形头像（字母 "A"）+ 姓名 "Alex Chen" + 简介 + 两个 CTA 按钮\n- **Skills** — 2列网格，8个技能卡片（名称 + 百分比 + 进度条），每个技能不同颜色\n- **Projects** — 2列网格，4个项目卡片（渐变背景 + 标题 + 描述 + 技术标签）\n- **Contact** — 居中联系区域 + CTA 按钮\n- **Footer** — Logo + 版权信息\n\n### 数据结构\n- skills 数组：name, level, color\n- projects 数组：title, desc, tags, gradient\n- navLinks 数组驱动导航渲染\n\n### 设计风格\n- 深色背景 gray-950，indigo/purple 渐变强调色\n- 文字渐变效果（bg-clip-text）\n- 圆角卡片 + 灰色边框 + backdrop-blur 导航',
    timestamp: '2024-12-15T14:00:05.000Z',
    type: 'text',
    summary: 'Emma 规划：6 个模块，indigo/purple 暗色主题，数据驱动',
  },
  {
    id: 'msg-4',
    role: 'alex',
    content:
      '个人作品集网站已生成完成。\n\n主要实现：\n- **Nav**: 固定顶部，"AC" 渐变 Logo + 4个导航链接，useState 管理激活状态\n- **Hero**: 渐变圆形头像（"A"）+ Alex Chen 名称 + 简介 + View Projects / Get in Touch 按钮\n- **Skills**: 2列网格，8个技能（React 95%、TypeScript 90%、Node.js 88%、Python 82%、Next.js 92%、PostgreSQL 78%、Docker 75%、Figma 70%），带彩色进度条\n- **Projects**: 2列网格，4个项目卡片，渐变背景 + 技术标签\n- **Contact**: 居中布局 + Send Message 按钮\n- **Footer**: Logo + 版权信息\n\n所有数据以数组形式定义在组件内，便于后续扩展。',
    timestamp: '2024-12-15T14:00:15.000Z',
    type: 'text',
    summary: 'Alex 生成：完整的个人作品集网站 React 组件',
    toolName: 'multi_file_codegen',
  },
  {
    id: 'msg-5',
    role: 'qa',
    content:
      'QA 检查通过，代码质量良好。\n\n检查项目：\n- ✅ React 组件结构完整，使用了 hooks（useState）\n- ✅ Tailwind CSS 类名使用规范\n- ✅ 技能和项目数据以数组驱动渲染，便于维护\n- ✅ 暗色主题 indigo/purple 配色一致\n- ✅ 导航使用 useState 管理激活状态\n- ✅ 渐变效果和 backdrop-blur 应用正确\n- ✅ 响应式布局（grid-cols-2）',
    timestamp: '2024-12-15T14:00:18.000Z',
    type: 'tool_call',
    summary: 'QA 检查通过',
    toolName: 'qa_reviewer',
  },
];

export const portfolioHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex Chen - Portfolio</title>
  <script src="/tailwind.js"></script>
</head>
<body class="bg-gray-950 text-white">
  <nav class="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
    <div class="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
      <div class="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AC</div>
      <div class="flex gap-6 text-sm text-gray-400">
        <a href="#" class="text-white">About</a>
        <a href="#" class="hover:text-white transition">Skills</a>
        <a href="#" class="hover:text-white transition">Projects</a>
        <a href="#" class="hover:text-white transition">Contact</a>
      </div>
    </div>
  </nav>
  <section class="pt-32 pb-16 px-6">
    <div class="max-w-6xl mx-auto flex flex-col items-center text-center">
      <div class="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold mb-6 ring-4 ring-indigo-500/20">A</div>
      <h1 class="text-5xl font-bold mb-4">Hi, I'm <span class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Alex Chen</span></h1>
      <p class="text-gray-400 text-lg max-w-xl mb-8">Full-stack developer crafting beautiful, performant web experiences.</p>
      <div class="flex gap-4">
        <button class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-lg font-medium">View Projects</button>
        <button class="border border-gray-700 px-6 py-3 rounded-lg text-gray-300">Get in Touch</button>
      </div>
    </div>
  </section>
  <section class="py-16 px-6">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-12">Skills & <span class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Expertise</span></h2>
      <div class="grid grid-cols-2 gap-6">
        <div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div class="flex justify-between mb-2"><span class="font-medium">React</span><span class="text-gray-400 text-sm">95%</span></div>
          <div class="h-2 bg-gray-800 rounded-full"><div class="h-full rounded-full bg-indigo-500" style="width:95%"></div></div>
        </div>
        <div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div class="flex justify-between mb-2"><span class="font-medium">TypeScript</span><span class="text-gray-400 text-sm">90%</span></div>
          <div class="h-2 bg-gray-800 rounded-full"><div class="h-full rounded-full bg-purple-500" style="width:90%"></div></div>
        </div>
      </div>
    </div>
  </section>
  <footer class="border-t border-gray-800 py-8 px-6">
    <div class="max-w-6xl mx-auto flex justify-between items-center text-sm text-gray-500">
      <span class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-bold">AC</span>
      <span>&copy; 2024 Alex Chen. All rights reserved.</span>
    </div>
  </footer>
</body>
</html>`;
