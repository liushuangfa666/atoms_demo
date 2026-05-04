import { ShowcaseProject } from './types';
import { ecommerceFiles, ecommerceMessages, ecommerceHtml } from './showcase-data/ecommerce-landing';
import { dataDashboardFiles, dataDashboardMessages, dataDashboardHtml } from './showcase-data/data-dashboard';
import { portfolioFiles, portfolioMessages, portfolioHtml } from './showcase-data/portfolio';
import { aiChatbotFiles, aiChatbotMessages, aiChatbotHtml } from './showcase-data/ai-chatbot';
import { gameLandingFiles, gameLandingMessages, gameLandingHtml } from './showcase-data/game-landing';
import { saasPricingFiles, saasPricingMessages, saasPricingHtml } from './showcase-data/saas-pricing';

export const showcases: ShowcaseProject[] = [
  {
    id: 'ecommerce-landing',
    name: '电商落地页',
    description: '精美的产品展示页面，包含 Hero 区、产品列表、购物车功能和 CTA 按钮',
    category: '电商',
    gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    usageCount: 45,
    prompt: '创建一个现代化的电商落地页，包含 Hero 区域、产品展示网格（8个产品）、购物车图标、促销横幅和页脚',
    htmlCode: ecommerceHtml,
    files: ecommerceFiles,
    messages: ecommerceMessages,
    recommendedMode: 'engineer',
  },
  {
    id: 'data-dashboard',
    name: '数据大屏',
    description: '实时数据监控面板，包含图表、KPI 卡片和数据表格',
    category: '数据',
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    usageCount: 28,
    prompt: '创建一个数据监控仪表盘，包含4个KPI卡片、一个折线图、一个柱状图和一个数据表格，使用深色主题',
    htmlCode: dataDashboardHtml,
    files: dataDashboardFiles,
    messages: dataDashboardMessages,
    recommendedMode: 'team',
  },
  {
    id: 'portfolio',
    name: '个人作品集',
    description: '展示个人项目和技能的精美作品集页面',
    category: '网站',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    usageCount: 36,
    prompt: '创建一个个人作品集网站，包含导航栏、Hero区域（头像+简介）、技能展示、项目作品网格（4个项目）和联系方式',
    htmlCode: portfolioHtml,
    files: portfolioFiles,
    messages: portfolioMessages,
    recommendedMode: 'engineer',
  },
  {
    id: 'ai-chatbot',
    name: 'AI 客服界面',
    description: '智能客服聊天界面，包含对话气泡和输入框',
    category: '生产力',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    usageCount: 52,
    prompt: '创建一个AI客服聊天界面，包含侧边栏（对话列表）、主聊天区域（消息气泡，区分用户和AI）、输入框和发送按钮',
    htmlCode: aiChatbotHtml,
    files: aiChatbotFiles,
    messages: aiChatbotMessages,
    recommendedMode: 'team',
  },
  {
    id: 'game-landing',
    name: '游戏宣传页',
    description: '炫酷的游戏产品宣传页面，包含动态效果',
    category: '游戏',
    gradient: 'linear-gradient(135deg, #fa709a, #fee140)',
    usageCount: 19,
    prompt: '创建一个游戏宣传落地页，包含全屏Hero区、游戏特色介绍、角色展示区和下载按钮',
    htmlCode: gameLandingHtml,
    files: gameLandingFiles,
    messages: gameLandingMessages,
    recommendedMode: 'engineer',
  },
  {
    id: 'saas-pricing',
    name: 'SaaS 定价页',
    description: '产品定价方案展示页，包含功能对比',
    category: '网站',
    gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    usageCount: 31,
    prompt: '创建一个SaaS定价页面，包含导航栏、产品介绍、3个定价方案卡片（基础版/专业版/企业版）、功能对比表格和FAQ区域',
    htmlCode: saasPricingHtml,
    files: saasPricingFiles,
    messages: saasPricingMessages,
    recommendedMode: 'team',
  },
];

export const categories = ['全部', '电商', '网站', '游戏', '数据', '生产力'];
