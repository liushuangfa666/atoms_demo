import { ProjectFile } from './types';

const PACKAGE_JSON = JSON.stringify({
  name: 'generated-app',
  private: true,
  version: '0.0.1',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'vite build',
  },
  dependencies: {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
    'lucide-react': '^0.468.0',
  },
  devDependencies: {
    '@vitejs/plugin-react': '^4.3.4',
    vite: '^6.0.0',
    '@tailwindcss/vite': '^4.0.0',
    tailwindcss: '^4.0.0',
  },
}, null, 2);

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
});
`;

const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

const MAIN_JSX = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

const INDEX_CSS = `@import "tailwindcss";
`;

/**
 * Returns the base template files for a React + Vite + Tailwind v4 project.
 * The LLM only needs to generate src/App.jsx (and optionally extra components).
 */
export function getBaseFiles(): Record<string, string> {
  return {
    'package.json': PACKAGE_JSON,
    'vite.config.js': VITE_CONFIG,
    'index.html': INDEX_HTML,
    'src/main.jsx': MAIN_JSX,
    'src/index.css': INDEX_CSS,
  };
}

/**
 * Build a complete ProjectFile[] from generated App.jsx content + optional extra files.
 */
export function buildProjectFiles(
  appJsx: string,
  extraFiles?: Record<string, string>,
): ProjectFile[] {
  const base = getBaseFiles();
  const allFiles: Record<string, string> = {
    ...base,
    'src/App.jsx': appJsx,
    ...(extraFiles || {}),
  };

  const langMap: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    html: 'html', css: 'css', json: 'json', md: 'markdown',
  };

  return Object.entries(allFiles).map(([path, content]) => ({
    path,
    content,
    language: langMap[path.split('.').pop() || ''] || 'text',
  }));
}

/**
 * Parse LLM output as a file map. If the output is not valid JSON,
 * treat the entire output as src/App.jsx content.
 */
export function parseFileMap(output: string): Record<string, string> {
  // Try to extract JSON from the output
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { 'src/App.jsx': output };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed === 'object' && parsed !== null) {
      const files: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') {
          files[key] = value;
        }
      }
      if (Object.keys(files).length > 0) return files;
    }
  } catch {
    // JSON parse failed — try regex-based extraction as fallback
    const files = extractFilesByRegex(output);
    if (Object.keys(files).length > 0) return files;
  }

  return { 'src/App.jsx': output };
}

/**
 * Fallback file extraction using regex when JSON.parse fails.
 * Handles cases where LLM generates JSON with unescaped characters in values.
 */
function extractFilesByRegex(output: string): Record<string, string> {
  const files: Record<string, string> = {};
  // Match "path/to/file.ext": "...content..."
  // File paths: src/..., app/..., components/..., etc.
  const pattern = /"((?:src|app|components|pages|lib|hooks|data|utils|styles|public|frontend)[/\w]*\.(?:jsx?|tsx?|css|json|html?|svg|md))"\s*:\s*"([\s\S]*?)"(?:\s*[,\}])/g;
  let match;
  while ((match = pattern.exec(output)) !== null) {
    const [, filePath, content] = match;
    // Unescape basic JSON string escapes
    files[filePath] = content
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  return files;
}

/**
 * Check if a file map contains the minimum required React project files.
 */
export function isReactProject(files: Record<string, string>): boolean {
  return 'src/App.jsx' in files || 'src/App.tsx' in files || 'package.json' in files;
}
