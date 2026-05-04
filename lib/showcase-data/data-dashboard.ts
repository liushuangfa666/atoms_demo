import { ProjectFile, Message } from '../types';

const APP_JSX = `import { useState } from 'react';

const kpiCards = [
  { label: '总营收', value: '¥2,847,560', change: '+12.5%', up: true, icon: '💰', color: 'from-blue-500 to-blue-600' },
  { label: '活跃用户', value: '58,432', change: '+8.3%', up: true, icon: '👥', color: 'from-emerald-500 to-emerald-600' },
  { label: '转化率', value: '3.24%', change: '-0.5%', up: false, icon: '📈', color: 'from-amber-500 to-amber-600' },
  { label: '订单量', value: '12,847', change: '+15.2%', up: true, icon: '🛒', color: 'from-purple-500 to-purple-600' },
];

const chartBars = [
  65, 45, 78, 52, 90, 68, 85, 42, 73, 58, 95, 60,
  70, 48, 82, 55, 88, 62, 76, 50, 92, 67, 80, 53,
  86, 71, 64, 77,
];

const trafficSources = [
  { name: '搜索引擎', percent: 42, color: 'bg-blue-500' },
  { name: '社交媒体', percent: 28, color: 'bg-emerald-500' },
  { name: '直接访问', percent: 18, color: 'bg-amber-500' },
  { name: '其他', percent: 12, color: 'bg-purple-500' },
];

const hotProducts = [
  { rank: 1, name: '智能手表 Pro', sales: 2847, revenue: '¥1,423,500', trend: 'up' },
  { rank: 2, name: '无线降噪耳机', sales: 2156, revenue: '¥862,400', trend: 'up' },
  { rank: 3, name: '便携充电宝', sales: 1893, revenue: '¥378,600', trend: 'down' },
  { rank: 4, name: '机械键盘 X1', sales: 1562, revenue: '¥702,900', trend: 'up' },
  { rank: 5, name: '智能台灯', sales: 1204, revenue: '¥240,800', trend: 'down' },
];

export default function App() {
  const [activeFilter, setActiveFilter] = useState('周');

  const filters = ['日', '周', '月'];

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold">D</div>
          <span className="text-xl font-bold">DataPulse</span>
        </div>
        <div className="flex gap-6 text-sm text-slate-400">
          <a href="#" className="text-white">概览</a>
          <a href="#" className="hover:text-white transition">分析</a>
          <a href="#" className="hover:text-white transition">报告</a>
          <a href="#" className="hover:text-white transition">设置</a>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400">🔔</span>
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm">A</div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">数据概览</h1>
            <p className="text-slate-400 text-sm mt-1">实时监控关键业务指标</p>
          </div>
          <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={\`px-4 py-1.5 rounded-md text-sm transition \${
                  activeFilter === f ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
                }\`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {kpiCards.map((card, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">{card.label}</span>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div className="text-2xl font-bold mb-1">{card.value}</div>
              <div className={\`text-sm \${card.up ? 'text-emerald-400' : 'text-red-400'}\`}>
                {card.change} 较上周
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {/* Revenue Bar Chart */}
          <div className="col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold">营收趋势</h2>
              <span className="text-xs text-slate-400">最近28天</span>
            </div>
            <div className="flex items-end gap-1.5 h-40">
              {chartBars.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-500/80 rounded-t-sm hover:bg-blue-400 transition cursor-pointer"
                  style={{ height: \`\${height}%\` }}
                  title={\`Day \${i + 1}: \${height}%\`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-500">
              <span>4/1</span>
              <span>4/7</span>
              <span>4/14</span>
              <span>4/21</span>
              <span>4/28</span>
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h2 className="font-bold mb-6">流量来源</h2>
            <div className="space-y-5">
              {trafficSources.map((source, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-300">{source.name}</span>
                    <span className="text-slate-400">{source.percent}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={\`h-full \${source.color} rounded-full transition-all duration-500\`}
                      style={{ width: \`\${source.percent}%\` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hot Products Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="font-bold">热门产品</h2>
            <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition">查看全部 →</a>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                <th className="px-5 py-3 font-medium">排名</th>
                <th className="px-5 py-3 font-medium">产品名称</th>
                <th className="px-5 py-3 font-medium">销量</th>
                <th className="px-5 py-3 font-medium">营收</th>
                <th className="px-5 py-3 font-medium">趋势</th>
              </tr>
            </thead>
            <tbody>
              {hotProducts.map((product) => (
                <tr key={product.rank} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                  <td className="px-5 py-3.5">
                    <span className={\`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold \${
                      product.rank <= 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'
                    }\`}>
                      {product.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-200">{product.name}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-300">{product.sales.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-300">{product.revenue}</td>
                  <td className="px-5 py-3.5 text-sm">
                    <span className={product.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}>
                      {product.trend === 'up' ? '↑' : '↓'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
`;

export const dataDashboardFiles: ProjectFile[] = [
  { path: 'package.json', content: JSON.stringify({
    name: 'data-dashboard', private: true, version: '0.0.1', type: 'module',
    scripts: { dev: 'vite', build: 'vite build' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1', 'lucide-react': '^0.468.0' },
    devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.0', '@tailwindcss/vite': '^4.0.0', tailwindcss: '^4.0.0' },
  }, null, 2), language: 'json' },
  { path: 'vite.config.js', content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport tailwindcss from '@tailwindcss/vite';\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  server: { headers: { 'Cross-Origin-Resource-Policy': 'cross-origin' } },\n});\n`, language: 'javascript' },
  { path: 'index.html', content: '<!DOCTYPE html>\n<html lang="zh-CN">\n  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>DataPulse - 数据监控仪表盘</title></head>\n  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>\n</html>', language: 'html' },
  { path: 'src/main.jsx', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);\n`, language: 'javascript' },
  { path: 'src/index.css', content: '@import "tailwindcss";\n', language: 'css' },
  { path: 'src/App.jsx', content: APP_JSX, language: 'javascript' },
];

export const dataDashboardMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: '创建一个数据监控仪表盘，包含4个KPI卡片、一个折线图、一个柱状图和一个数据表格，使用深色主题',
    timestamp: '2024-12-02T14:00:00.000Z',
  },
  {
    id: 'msg-2',
    role: 'mike',
    content: '收到需求，这是一个深色主题的数据监控仪表盘项目。我将为你启动团队协作流程：\n\n1. **Emma** 负责页面结构规划\n2. **Alex** 负责组件开发和代码生成\n3. **QA** 负责最终质量检查\n\n开始处理...',
    timestamp: '2024-12-02T14:00:02.000Z',
    type: 'text',
    summary: 'Mike 路由分析：新需求，数据仪表盘项目，启动团队流程',
  },
  {
    id: 'msg-3',
    role: 'emma',
    content: '## 页面结构规划\n\n这是一个深色主题数据监控仪表盘，需要以下模块：\n\n### 组件拆分\n- **Navbar** — 品牌名 DataPulse + 导航链接 + 通知图标 + 用户头像\n- **KPI Cards** — 4 个指标卡片（总营收、活跃用户、转化率、订单量），含数值、涨跌幅、图标\n- **Bar Chart** — CSS 纯柱状图，28 根柱子展示营收趋势，悬停交互\n- **Traffic Sources** — 4 条进度条展示流量来源占比\n- **Data Table** — 热门产品表格，含排名、名称、销量、营收、趋势\n\n### 数据结构\n- KPI 数组：label, value, change, up, icon, color\n- 柱状图数组：28 个高度百分比值\n- 流量来源数组：name, percent, color\n- 产品数组：rank, name, sales, revenue, trend\n- 使用 useState 管理日/周/月筛选器\n\n### 设计风格\n- 主色调：slate-900 深色背景 + blue-500 强调色\n- slate-800 卡片背景 + slate-700 边框\n- emerald 红绿色表示涨跌',
    timestamp: '2024-12-02T14:00:05.000Z',
    type: 'text',
    summary: 'Emma 规划：5 个模块，slate 深色主题，CSS 柱状图，数据驱动',
  },
  {
    id: 'msg-4',
    role: 'alex',
    content: '数据监控仪表盘已生成完成。\n\n主要实现：\n- **Navbar**: DataPulse 品牌导航 + 通知铃铛 + 用户头像\n- **KPI Cards**: 4 个指标卡片（总营收 ¥2,847,560 ↑12.5%、活跃用户 58,432 ↑8.3%、转化率 3.24% ↓0.5%、订单量 12,847 ↑15.2%）\n- **Bar Chart**: 纯 CSS 实现 28 根柱状图，悬停变色交互，底部日期刻度\n- **Traffic Sources**: 搜索引擎 42%、社交媒体 28%、直接访问 18%、其他 12%\n- **Data Table**: 5 行热门产品数据，前三名金色高亮排名徽章，涨跌箭头指示\n\n使用 useState 管理日/周/月筛选器切换，所有数据以内联数组定义。',
    timestamp: '2024-12-02T14:00:15.000Z',
    type: 'text',
    summary: 'Alex 生成：完整的深色主题数据仪表盘 React 组件',
    toolName: 'multi_file_codegen',
  },
  {
    id: 'msg-5',
    role: 'qa',
    content: '✅ QA 检查通过，代码质量良好。\n\n检查项目：\n- ✅ React 组件结构完整，使用了 hooks（useState）\n- ✅ Tailwind CSS 类名使用规范，深色主题配色一致\n- ✅ 柱状图使用纯 CSS 实现，无外部图表库依赖\n- ✅ 数据以数组驱动渲染，便于后续对接 API\n- ✅ 中文 UI 文案完整\n- ✅ 日/周/月筛选器交互逻辑正确',
    timestamp: '2024-12-02T14:00:18.000Z',
    type: 'tool_call',
    summary: 'QA 检查通过',
    toolName: 'qa_reviewer',
  },
];

export const dataDashboardHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DataPulse - 数据监控仪表盘</title>
  <script src="/tailwind.js"></script>
</head>
<body class="bg-slate-900 text-white">
  <nav class="flex items-center justify-between px-8 py-4 border-b border-slate-700">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold">D</div>
      <span class="text-xl font-bold">DataPulse</span>
    </div>
    <div class="flex gap-6 text-sm text-slate-400">
      <a href="#" class="text-white">概览</a>
      <a href="#" class="hover:text-white transition">分析</a>
      <a href="#" class="hover:text-white transition">报告</a>
      <a href="#" class="hover:text-white transition">设置</a>
    </div>
    <div class="flex items-center gap-4">
      <span class="text-slate-400">🔔</span>
      <div class="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm">A</div>
    </div>
  </nav>
  <main class="max-w-7xl mx-auto px-8 py-8">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold">数据概览</h1>
        <p class="text-slate-400 text-sm mt-1">实时监控关键业务指标</p>
      </div>
      <div class="flex gap-1 bg-slate-800 rounded-lg p-1">
        <button class="px-4 py-1.5 rounded-md text-sm text-slate-400 hover:text-white transition">日</button>
        <button class="px-4 py-1.5 rounded-md text-sm bg-blue-500 text-white">周</button>
        <button class="px-4 py-1.5 rounded-md text-sm text-slate-400 hover:text-white transition">月</button>
      </div>
    </div>
    <div class="grid grid-cols-4 gap-5 mb-8">
      <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <span class="text-slate-400 text-sm">总营收</span>
          <span class="text-2xl">💰</span>
        </div>
        <div class="text-2xl font-bold mb-1">¥2,847,560</div>
        <div class="text-sm text-emerald-400">+12.5% 较上周</div>
      </div>
      <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <span class="text-slate-400 text-sm">活跃用户</span>
          <span class="text-2xl">👥</span>
        </div>
        <div class="text-2xl font-bold mb-1">58,432</div>
        <div class="text-sm text-emerald-400">+8.3% 较上周</div>
      </div>
      <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <span class="text-slate-400 text-sm">转化率</span>
          <span class="text-2xl">📈</span>
        </div>
        <div class="text-2xl font-bold mb-1">3.24%</div>
        <div class="text-sm text-red-400">-0.5% 较上周</div>
      </div>
      <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <span class="text-slate-400 text-sm">订单量</span>
          <span class="text-2xl">🛒</span>
        </div>
        <div class="text-2xl font-bold mb-1">12,847</div>
        <div class="text-sm text-emerald-400">+15.2% 较上周</div>
      </div>
    </div>
  </main>
</body>
</html>`;
