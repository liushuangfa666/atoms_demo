import { ProjectFile, Message } from '../types';

const APP_JSX = `import { useState } from 'react';

const plans = [
  {
    name: '基础版',
    desc: '适合个人用户和小型项目',
    price: 29,
    color: 'gray',
    popular: false,
    features: ['5 个项目', '10GB 存储空间', '基础分析', '邮件支持', 'API 访问'],
  },
  {
    name: '专业版',
    desc: '适合成长中的团队',
    price: 99,
    color: 'indigo',
    popular: true,
    features: ['无限项目', '100GB 存储空间', '高级分析', '优先支持', 'API + Webhook', '团队协作', '自定义域名'],
  },
  {
    name: '企业版',
    desc: '适合大型组织和企业',
    price: 299,
    color: 'gray',
    popular: false,
    features: ['无限项目', '无限存储', '企业级分析', '专属客服', '完整 API', 'SSO 单点登录', 'SLA 保障', '私有部署'],
  },
];

const comparisons = [
  { feature: '项目数量', basic: '5个', pro: '无限', enterprise: '无限' },
  { feature: '存储空间', basic: '10GB', pro: '100GB', enterprise: '无限' },
  { feature: '团队成员', basic: '1人', pro: '10人', enterprise: '无限' },
  { feature: 'API 调用', basic: '1K/天', pro: '50K/天', enterprise: '无限' },
  { feature: '自定义域名', basic: '—', pro: '✓', enterprise: '✓' },
  { feature: 'SSO 单点登录', basic: '—', pro: '—', enterprise: '✓' },
  { feature: 'SLA 保障', basic: '—', pro: '—', enterprise: '99.9%' },
];

const faqs = [
  { q: '可以随时更换方案吗？', a: '当然可以！您可以随时升级或降级方案，差价会自动计算。' },
  { q: '试用期结束后会自动扣费吗？', a: '不会。试用期结束后需要手动选择方案才会开始计费。' },
  { q: '支持哪些支付方式？', a: '我们支持支付宝、微信支付和银行转账。企业版支持对公转账。' },
];

export default function App() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="bg-white text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-indigo-600">FlowSaaS</span>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-900 transition">产品</a>
              <a href="#" className="hover:text-gray-900 transition">功能</a>
              <a href="#" className="text-gray-900 font-medium">定价</a>
              <a href="#" className="hover:text-gray-900 transition">文档</a>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900 py-2 transition">登录</a>
            <a href="#" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">免费试用</a>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="text-center py-16 px-6">
        <h1 className="text-4xl font-bold mb-4">选择适合你的方案</h1>
        <p className="text-gray-500 max-w-md mx-auto">所有方案均包含14天免费试用，无需信用卡</p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={\`text-sm font-medium \${!isYearly ? 'text-gray-900' : 'text-gray-400'}\`}>月付</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={\`w-11 h-6 rounded-full relative cursor-pointer transition-colors \${isYearly ? 'bg-indigo-600' : 'bg-gray-300'}\`}
          >
            <div className={\`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all \${isYearly ? 'right-0.5' : 'left-0.5'}\`} />
          </button>
          <span className="text-sm text-gray-400">年付 <span className="text-indigo-600 font-medium">省20%</span></span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div key={i} className={\`rounded-2xl p-6 relative \${plan.popular ? 'border-2 border-indigo-600 shadow-xl shadow-indigo-500/10' : 'border border-gray-200'}\`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">最受欢迎</div>
              )}
              <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">¥{isYearly ? Math.round(plan.price * 0.8) : plan.price}</span>
                <span className="text-gray-400">/月</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <span className={plan.popular ? 'text-indigo-500' : 'text-green-500'}>✓</span>
                    <span className="text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
              <button className={\`w-full py-2.5 rounded-lg text-sm font-medium transition \${
                plan.popular
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }\`}>
                {plan.name === '企业版' ? '联系销售' : '开始试用'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">功能对比</h2>
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-6 py-3">功能</th>
                <th className="text-center px-4 py-3">基础版</th>
                <th className="text-center px-4 py-3 text-indigo-600">专业版</th>
                <th className="text-center px-4 py-3">企业版</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comparisons.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">{row.feature}</td>
                  <td className="text-center px-4 py-3 text-gray-400">{row.basic}</td>
                  <td className="text-center px-4 py-3 font-medium">{row.pro}</td>
                  <td className="text-center px-4 py-3 text-gray-400">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">常见问题</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border rounded-xl px-6 py-4 cursor-pointer hover:border-gray-300 transition" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <p className="font-medium text-sm">{faq.q}</p>
              {openFaq === i && <p className="text-sm text-gray-500 mt-1">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-400">
        &copy; 2024 FlowSaaS. All rights reserved.
      </footer>
    </div>
  );
}
`;

const baseFiles = {
  pkg: JSON.stringify({
    name: 'saas-pricing', private: true, version: '0.0.1', type: 'module',
    scripts: { dev: 'vite', build: 'vite build' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1', 'lucide-react': '^0.468.0' },
    devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.0', '@tailwindcss/vite': '^4.0.0', tailwindcss: '^4.0.0' },
  }, null, 2),
  vite: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport tailwindcss from '@tailwindcss/vite';\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  server: { headers: { 'Cross-Origin-Resource-Policy': 'cross-origin' } },\n});\n`,
  html: '<!DOCTYPE html>\n<html lang="zh-CN">\n  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>FlowSaaS - 定价方案</title></head>\n  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>\n</html>',
  main: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);\n`,
  css: '@import "tailwindcss";\n',
};

export const saasPricingFiles: ProjectFile[] = [
  { path: 'package.json', content: baseFiles.pkg, language: 'json' },
  { path: 'vite.config.js', content: baseFiles.vite, language: 'javascript' },
  { path: 'index.html', content: baseFiles.html, language: 'html' },
  { path: 'src/main.jsx', content: baseFiles.main, language: 'javascript' },
  { path: 'src/index.css', content: baseFiles.css, language: 'css' },
  { path: 'src/App.jsx', content: APP_JSX, language: 'javascript' },
];

export const saasPricingMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: '创建一个SaaS定价页面，包含导航栏、产品介绍、3个定价方案卡片（基础版/专业版/企业版）、功能对比表格和FAQ区域',
    timestamp: '2024-12-01T12:00:00.000Z',
  },
  {
    id: 'msg-2',
    role: 'mike',
    content: '这是一个 SaaS 定价页面，需要精心设计的卡片对比和交互效果。安排如下：\n\n1. **Emma** 规划定价策略和页面结构\n2. **Alex** 实现定价卡片 + 月/年切换 + FAQ 手风琴\n3. **QA** 检查交互逻辑\n\n开始处理...',
    timestamp: '2024-12-01T12:00:02.000Z',
    type: 'text',
    summary: 'Mike 路由：SaaS 定价页，需要交互组件',
  },
  {
    id: 'msg-3',
    role: 'emma',
    content: '## SaaS 定价页结构规划\n\n### 定价策略\n- 3 个方案：基础版 ¥29/月、专业版 ¥99/月（推荐）、企业版 ¥299/月\n- 月付/年付切换，年付省 20%\n- 专业版高亮显示「最受欢迎」标签\n\n### 交互组件\n1. **月/年切换** — useState 控制，年付价格 × 0.8\n2. **功能对比表格** — 7 行对比数据\n3. **FAQ 手风琴** — 点击展开/收起\n\n### 页面模块\n- Nav（FlowSaaS 品牌）\n- Header（标题 + 月/年切换）\n- 3 列定价卡片\n- 功能对比表格\n- FAQ 区域\n- Footer',
    timestamp: '2024-12-01T12:00:06.000Z',
    type: 'text',
    summary: 'Emma 规划：3 方案 + 月年切换 + FAQ 手风琴',
  },
  {
    id: 'msg-4',
    role: 'alex',
    content: 'SaaS 定价页已完成。\n\n主要实现：\n- **定价卡片**: 3 列布局，专业版使用 indigo 边框高亮 + 浮动标签\n- **月/年切换**: 点击切换按钮，年付价格自动打 8 折\n- **功能对比表**: 7 行对比数据，专业版列高亮\n- **FAQ 手风琴**: 点击展开/收起答案，useState 管理展开状态\n- 所有数据以数组形式定义（plans, comparisons, faqs），便于后续对接 CMS',
    timestamp: '2024-12-01T12:00:18.000Z',
    type: 'text',
    summary: 'Alex 生成：完整的 SaaS 定价页，含交互切换和 FAQ',
    toolName: 'multi_file_codegen',
  },
  {
    id: 'msg-5',
    role: 'qa',
    content: '✅ QA 检查通过。\n\n- ✅ 月/年价格切换逻辑正确（年付 = 价格 × 0.8）\n- ✅ 专业版卡片高亮样式正确\n- ✅ FAQ 手风琴交互正常（点击展开/收起）\n- ✅ 数据结构清晰，数组驱动渲染\n- ✅ 功能对比表格对齐正确',
    timestamp: '2024-12-01T12:00:21.000Z',
    type: 'tool_call',
    summary: 'QA 检查通过，交互逻辑正确',
    toolName: 'qa_reviewer',
  },
];

export const saasPricingHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlowSaaS - 定价方案</title>
  <script src="/tailwind.js"></script>
</head>
<body class="bg-white text-gray-900">
  <nav class="border-b border-gray-100 px-8 py-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <span class="text-xl font-bold text-indigo-600">FlowSaaS</span>
      <div class="flex gap-6 text-sm text-gray-500">
        <a href="#">产品</a>
        <a href="#">功能</a>
        <a href="#" class="text-gray-900 font-medium">定价</a>
      </div>
    </div>
  </nav>
  <section class="text-center py-16 px-6">
    <h1 class="text-4xl font-bold mb-4">选择适合你的方案</h1>
    <p class="text-gray-500">所有方案均包含14天免费试用</p>
  </section>
  <section class="max-w-5xl mx-auto px-6 pb-16">
    <div class="grid grid-cols-3 gap-6">
      <div class="border border-gray-200 rounded-2xl p-6">
        <h3 class="font-bold text-lg mb-1">基础版</h3>
        <span class="text-4xl font-bold">¥29</span><span class="text-gray-400">/月</span>
        <ul class="mt-4 space-y-2 text-sm"><li>✓ 5 个项目</li><li>✓ 10GB 存储</li><li>✓ 基础分析</li></ul>
        <button class="w-full mt-6 bg-gray-100 py-2.5 rounded-lg text-sm font-medium">开始试用</button>
      </div>
      <div class="border-2 border-indigo-600 rounded-2xl p-6 shadow-xl">
        <div class="text-center -mt-8 mb-2"><span class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">最受欢迎</span></div>
        <h3 class="font-bold text-lg mb-1">专业版</h3>
        <span class="text-4xl font-bold">¥99</span><span class="text-gray-400">/月</span>
        <ul class="mt-4 space-y-2 text-sm"><li>✓ 无限项目</li><li>✓ 100GB 存储</li><li>✓ 高级分析</li></ul>
        <button class="w-full mt-6 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium">开始试用</button>
      </div>
      <div class="border border-gray-200 rounded-2xl p-6">
        <h3 class="font-bold text-lg mb-1">企业版</h3>
        <span class="text-4xl font-bold">¥299</span><span class="text-gray-400">/月</span>
        <ul class="mt-4 space-y-2 text-sm"><li>✓ 无限项目</li><li>✓ 无限存储</li><li>✓ SSO 登录</li></ul>
        <button class="w-full mt-6 bg-gray-100 py-2.5 rounded-lg text-sm font-medium">联系销售</button>
      </div>
    </div>
  </section>
</body>
</html>`;
