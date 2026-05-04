'use client';

import { Project } from '@/lib/types';

interface Props {
  project: Project;
}

export default function DownloadButton({ project }: Props) {
  const handleDownload = async () => {
    if (!project.files || project.files.length === 0) {
      // Single HTML file — replace CDN with local reference
      const localizedCode = localizeTailwind(project.currentCode);
      const blob = new Blob([localizedCode], { type: 'text/html' });
      downloadBlob(blob, `${project.name}.html`);
      return;
    }

    // Multi-file: create ZIP
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const isReact = project.projectType === 'react-vite';
    const hasTailwindCdn = project.files.some(f =>
      f.content?.includes('cdn.tailwindcss.com')
    );

    for (const file of project.files) {
      const content = localizeTailwind(file.content);
      zip.file(file.path, content);
    }

    // Include local Tailwind script for legacy HTML projects
    if (hasTailwindCdn) {
      try {
        const resp = await fetch('/tailwind.js');
        const script = await resp.text();
        zip.file('tailwind.js', script);
      } catch { /* keep CDN reference */ }
    }

    // Add README
    zip.file('README.md', buildReadme(project));

    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${project.name}.zip`);
  };

  const fileCount = project.files?.length || 0;

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-bg-card transition-colors"
      title="下载项目代码"
    >
      <span>⬇</span>
      下载{fileCount > 1 ? ` (${fileCount} 文件)` : ''}
    </button>
  );
}

function localizeTailwind(content: string): string {
  return content.replace(
    /(<script\s+src=["'])https:\/\/cdn\.tailwindcss\.com\/?["']/g,
    '$1./tailwind.js"'
  );
}

function buildReadme(project: Project): string {
  const isReact = project.projectType === 'react-vite';
  const fileList = project.files.map(f => `- \`${f.path}\``).join('\n');

  if (isReact) {
    return `# ${project.name}

由 Atoms AI 自动生成。

## 项目结构

${fileList}

## 快速开始

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
\`\`\`

浏览器访问 http://localhost:5173 查看效果。

## 构建生产版本

\`\`\`bash
npm run build
\`\`\`

构建产物在 \`dist/\` 目录。

## 技术栈

- React 18
- Vite 6
- Tailwind CSS v4
- lucide-react（图标库）
`;
  }

  return `# ${project.name}

由 Atoms AI 自动生成。

## 文件列表

${fileList}

## 使用方式

直接在浏览器中打开 \`index.html\` 文件即可查看效果。
`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
