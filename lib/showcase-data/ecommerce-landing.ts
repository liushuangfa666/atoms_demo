import { ProjectFile, Message } from '../types';

const APP_JSX = `import { useState } from 'react';

const products = [
  { name: '极简台灯', price: 199, original: 399, badge: '新品', bg: 'bg-amber-50' },
  { name: '无线耳机', price: 299, original: 599, badge: '热卖', bg: 'bg-blue-50' },
  { name: '智能手表', price: 899, original: 1299, badge: '', bg: 'bg-purple-50' },
  { name: '便携音箱', price: 159, original: 319, badge: '限时', bg: 'bg-pink-50' },
  { name: '机械键盘', price: 449, original: 699, badge: '', bg: 'bg-gray-50' },
  { name: '桌面收纳', price: 89, original: 149, badge: '新品', bg: 'bg-green-50' },
  { name: '创意马克杯', price: 59, original: 99, badge: '', bg: 'bg-orange-50' },
  { name: '蓝牙鼠标', price: 129, original: 259, badge: '热卖', bg: 'bg-indigo-50' },
];

export default function App() {
  const [cartCount] = useState(3);

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b">
        <div className="text-xl font-bold text-emerald-600">ShopVibe</div>
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-emerald-600">首页</a>
          <a href="#" className="hover:text-emerald-600">新品</a>
          <a href="#" className="hover:text-emerald-600">分类</a>
          <a href="#" className="hover:text-emerald-600">优惠</a>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500">🛒 {cartCount}</span>
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm">U</div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-r from-emerald-50 to-teal-50 py-20 px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-12">
          <div className="flex-1">
            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">限时特惠</span>
            <h1 className="text-4xl font-bold mt-4 mb-4">春夏新品<br />低至<span className="text-emerald-600">3折</span></h1>
            <p className="text-gray-500 mb-6">精选全球好物，品质生活从这里开始</p>
            <div className="flex gap-3">
              <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition">立即抢购</button>
              <button className="border border-emerald-600 text-emerald-600 px-6 py-3 rounded-lg hover:bg-emerald-50 transition">查看更多</button>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="h-32 bg-emerald-100 rounded-lg mb-2" />
              <p className="text-xs text-gray-500">新品推荐</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm mt-4">
              <div className="h-32 bg-teal-100 rounded-lg mb-2" />
              <p className="text-xs text-gray-500">热卖单品</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-6xl mx-auto py-16 px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">热门商品</h2>
          <a href="#" className="text-sm text-emerald-600 hover:underline">查看全部 →</a>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {products.map((p, i) => (
            <div key={i} className="group border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer">
              <div className={\`\${p.bg} h-40 flex items-center justify-center relative\`}>
                {p.badge && <span className="absolute top-2 left-2 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded">{p.badge}</span>}
                <span className="text-4xl">📦</span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-emerald-600 font-bold">¥{p.price}</span>
                  <span className="text-xs text-gray-400 line-through">¥{p.original}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="max-w-6xl mx-auto px-8 mb-16">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-8 flex items-center justify-between text-white">
          <div>
            <h3 className="text-xl font-bold mb-1">新用户专享</h3>
            <p className="text-emerald-100 text-sm">首次下单立减 ¥50，更有满减优惠等你来</p>
          </div>
          <button className="bg-white text-emerald-600 px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-50 transition">立即领取</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-10 px-8">
        <div className="max-w-6xl mx-auto flex justify-between text-sm text-gray-500">
          <div>
            <p className="font-bold text-gray-900 mb-2">ShopVibe</p>
            <p>品质生活，从这里开始</p>
          </div>
          <div>
            <p className="font-medium mb-2 text-gray-700">客户服务</p>
            <p className="mb-1">帮助中心</p>
            <p>退换货政策</p>
          </div>
          <div>
            <p className="font-medium mb-2 text-gray-700">关于我们</p>
            <p className="mb-1">公司介绍</p>
            <p>联系方式</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
`;

export const ecommerceFiles: ProjectFile[] = [
  { path: 'package.json', content: JSON.stringify({
    name: 'ecommerce-landing', private: true, version: '0.0.1', type: 'module',
    scripts: { dev: 'vite', build: 'vite build' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1', 'lucide-react': '^0.468.0' },
    devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.0', '@tailwindcss/vite': '^4.0.0', tailwindcss: '^4.0.0' },
  }, null, 2), language: 'json' },
  { path: 'vite.config.js', content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport tailwindcss from '@tailwindcss/vite';\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  server: { headers: { 'Cross-Origin-Resource-Policy': 'cross-origin' } },\n});\n`, language: 'javascript' },
  { path: 'index.html', content: '<!DOCTYPE html>\n<html lang="zh-CN">\n  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>ShopVibe</title></head>\n  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>\n</html>', language: 'html' },
  { path: 'src/main.jsx', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);\n`, language: 'javascript' },
  { path: 'src/index.css', content: '@import "tailwindcss";\n', language: 'css' },
  { path: 'src/App.jsx', content: APP_JSX, language: 'javascript' },
];

export const ecommerceMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: '创建一个现代化的电商落地页，包含 Hero 区域、产品展示网格（8个产品）、购物车图标、促销横幅和页脚',
    timestamp: '2024-12-01T10:00:00.000Z',
  },
  {
    id: 'msg-2',
    role: 'mike',
    content: '收到需求，这是一个全新的电商落地页项目。我将为你启动团队协作流程：\n\n1. **Emma** 负责页面结构规划\n2. **Alex** 负责组件开发和代码生成\n3. **QA** 负责最终质量检查\n\n开始处理...',
    timestamp: '2024-12-01T10:00:02.000Z',
    type: 'text',
    summary: 'Mike 路由分析：新需求，启动团队流程',
  },
  {
    id: 'msg-3',
    role: 'emma',
    content: '## 页面结构规划\n\n这是一个电商落地页，需要以下模块：\n\n### 组件拆分\n- **Navbar** — 品牌名 ShopVibe + 导航链接 + 购物车图标\n- **Hero** — 左侧文案（限时特惠标签 + 标题 + CTA按钮），右侧装饰卡片\n- **ProductGrid** — 4列网格，8个产品卡片（图片区 + 名称 + 价格 + 标签）\n- **PromoBanner** — 渐变背景促销横幅\n- **Footer** — 三栏布局\n\n### 数据结构\n- 产品数组：name, price, originalPrice, badge, bgColor\n- 使用 useState 管理购物车数量\n\n### 设计风格\n- 主色调：emerald/teal 绿色系\n- 白色背景 + 灰色文字 + 红色标签\n- 圆角卡片 + 悬停阴影',
    timestamp: '2024-12-01T10:00:05.000Z',
    type: 'text',
    summary: 'Emma 规划：5 个模块，emerald 配色，产品数据驱动',
  },
  {
    id: 'msg-4',
    role: 'alex',
    content: '电商落地页已生成完成。\n\n主要实现：\n- **Navbar**: ShopVibe 品牌导航 + 购物车图标，显示商品数量\n- **Hero**: 左右布局，左侧限时特惠文案 + CTA 按钮，右侧装饰卡片\n- **ProductGrid**: 4 列网格渲染 8 个产品，支持标签（新品/热卖/限时）\n- **PromoBanner**: emerald 渐变背景，新用户 ¥50 优惠\n- **Footer**: 三栏布局（品牌/客户服务/关于我们）\n\n产品数据以数组形式定义在组件内，便于后续对接 API。',
    timestamp: '2024-12-01T10:00:15.000Z',
    type: 'text',
    summary: 'Alex 生成：完整的电商落地页 React 组件',
    toolName: 'multi_file_codegen',
  },
  {
    id: 'msg-5',
    role: 'qa',
    content: '✅ QA 检查通过，代码质量良好。\n\n交互验证：\n- ✅ "立即抢购" 按钮 → 存在，有 onClick 样式（hover:bg-emerald-700）\n- ✅ "查看更多" 按钮 → 存在，有过渡动画\n- ✅ "立即领取" 促销按钮 → 存在，hover 交互正确\n- ✅ 购物车图标 🛒 → 显示数量（useState cartCount=3）\n- ✅ 导航链接（首页/新品/分类/优惠）→ 全部存在\n\n代码质量：\n- ✅ React hooks 使用规范（useState）\n- ✅ 产品数组驱动渲染，8 个产品 + badge 标签\n- ✅ Tailwind CSS 类名规范\n- ✅ 响应式布局（grid-cols-4）',
    timestamp: '2024-12-01T10:00:18.000Z',
    type: 'tool_call',
    summary: 'QA 检查通过',
    toolName: 'qa_reviewer',
  },
];

export const ecommerceHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShopVibe - 发现好物</title>
  <script src="/tailwind.js"></script>
</head>
<body class="bg-white text-gray-900">
  <nav class="flex items-center justify-between px-8 py-4 border-b">
    <div class="text-xl font-bold text-emerald-600">ShopVibe</div>
    <div class="flex gap-6 text-sm text-gray-600">
      <a href="#" class="hover:text-emerald-600">首页</a>
      <a href="#" class="hover:text-emerald-600">新品</a>
      <a href="#" class="hover:text-emerald-600">分类</a>
      <a href="#" class="hover:text-emerald-600">优惠</a>
    </div>
    <div class="flex items-center gap-4">
      <span class="text-gray-500">🛒 3</span>
      <div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm">U</div>
    </div>
  </nav>
  <section class="relative bg-gradient-to-r from-emerald-50 to-teal-50 py-20 px-8">
    <div class="max-w-6xl mx-auto flex items-center gap-12">
      <div class="flex-1">
        <span class="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">限时特惠</span>
        <h1 class="text-4xl font-bold mt-4 mb-4">春夏新品<br/>低至<span class="text-emerald-600">3折</span></h1>
        <p class="text-gray-500 mb-6">精选全球好物，品质生活从这里开始</p>
        <div class="flex gap-3">
          <button class="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition">立即抢购</button>
          <button class="border border-emerald-600 text-emerald-600 px-6 py-3 rounded-lg hover:bg-emerald-50 transition">查看更多</button>
        </div>
      </div>
    </div>
  </section>
  <section class="max-w-6xl mx-auto py-16 px-8">
    <h2 class="text-2xl font-bold mb-8">热门商品</h2>
    <div class="grid grid-cols-4 gap-5">
      <div class="border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer">
        <div class="bg-amber-50 h-40 flex items-center justify-center"><span class="text-4xl">📦</span></div>
        <div class="p-3"><p class="text-sm font-medium">极简台灯</p><span class="text-emerald-600 font-bold">¥199</span></div>
      </div>
      <div class="border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer">
        <div class="bg-blue-50 h-40 flex items-center justify-center"><span class="text-4xl">📦</span></div>
        <div class="p-3"><p class="text-sm font-medium">无线耳机</p><span class="text-emerald-600 font-bold">¥299</span></div>
      </div>
      <div class="border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer">
        <div class="bg-purple-50 h-40 flex items-center justify-center"><span class="text-4xl">📦</span></div>
        <div class="p-3"><p class="text-sm font-medium">智能手表</p><span class="text-emerald-600 font-bold">¥899</span></div>
      </div>
      <div class="border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer">
        <div class="bg-pink-50 h-40 flex items-center justify-center"><span class="text-4xl">📦</span></div>
        <div class="p-3"><p class="text-sm font-medium">便携音箱</p><span class="text-emerald-600 font-bold">¥159</span></div>
      </div>
    </div>
  </section>
  <footer class="bg-gray-50 border-t py-10 px-8">
    <div class="max-w-6xl mx-auto flex justify-between text-sm text-gray-500">
      <div><p class="font-bold text-gray-900 mb-2">ShopVibe</p><p>品质生活，从这里开始</p></div>
      <div><p class="font-medium mb-2 text-gray-700">客户服务</p><p>帮助中心</p></div>
    </div>
  </footer>
</body>
</html>`;
