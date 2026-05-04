import * as esbuild from 'esbuild';
import { ProjectFile } from './types';

const VIRTUAL_ENTRY = 'virtual-entry.jsx';
const VIRTUAL_NS = 'virtual';

/**
 * Build a self-contained HTML preview from React project files using esbuild.
 * All deps (React, ReactDOM, lucide-react) are bundled inline.
 * Tailwind classes are handled at runtime via /tailwind.js.
 */
export async function buildPreviewHtml(files: ProjectFile[]): Promise<string | null> {
  try {
    const fileMap = new Map(files.map(f => [f.path, f.content]));

    const appPath = files.find(f => f.path === 'src/App.jsx' || f.path === 'src/App.tsx')?.path;
    if (!appPath) return null;

    // Synthesized entry — render App into #root
    const entryContent = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './${appPath}';
createRoot(document.getElementById('root')).render(React.createElement(App));
`;

    const virtualFs: esbuild.Plugin = {
      name: 'virtual-fs',
      setup(build) {
        // Resolve virtual entry
        build.onResolve({ filter: new RegExp(`^${VIRTUAL_ENTRY}$`) }, () => ({
          path: VIRTUAL_ENTRY, namespace: VIRTUAL_NS,
        }));

        // Resolve relative imports within virtual FS
        build.onResolve({ filter: /^\./ }, (args) => {
          if (args.namespace !== VIRTUAL_NS) return null;
          const resolved = resolveRelative(args.importer, args.path, fileMap);
          if (resolved) return { path: resolved, namespace: VIRTUAL_NS };
          return null;
        });

        // Bare imports (react, lucide-react, etc.) → let esbuild resolve from node_modules
        // (no handler needed — esbuild default resolver handles them)

        // Load virtual files
        build.onLoad({ filter: /.*/, namespace: VIRTUAL_NS }, (args) => {
          if (args.path === VIRTUAL_ENTRY) {
            return { contents: entryContent, loader: 'jsx', resolveDir: '/' };
          }
          const content = fileMap.get(args.path);
          if (content !== undefined) {
            const ext = args.path.split('.').pop() || '';
            const loader: esbuild.Loader = ['jsx', 'tsx'].includes(ext) ? 'jsx' : 'js';
            return { contents: content, loader, resolveDir: '/' };
          }
          return null;
        });

        // CSS imports → return empty (Tailwind CDN handles styles)
        build.onLoad({ filter: /\.css$/, namespace: VIRTUAL_NS }, () => ({
          contents: '', loader: 'css',
        }));
      },
    };

    const result = await esbuild.build({
      entryPoints: [VIRTUAL_ENTRY],
      bundle: true,
      write: false,
      format: 'iife',
      plugins: [virtualFs],
      jsx: 'automatic',
      target: ['es2020'],
      minify: true,
      treeShaking: true,
      logLevel: 'silent',
    });

    const jsCode = result.outputFiles?.[0]?.text;
    if (!jsCode) return null;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preview</title>
<script src="/tailwind.js"><\/script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}</style>
</head>
<body>
<div id="root"></div>
<script>${jsCode}<\/script>
</body>
</html>`;
  } catch (err: any) {
    console.error('[build-preview] Failed:', err?.message || String(err));
    if (err?.errors) console.error('[build-preview] Errors:', JSON.stringify(err.errors));
    return null;
  }
}

function resolveRelative(importer: string, importPath: string, fileMap: Map<string, string>): string | null {
  const dir = importer === VIRTUAL_ENTRY ? '' : importer.includes('/') ? importer.substring(0, importer.lastIndexOf('/')) : '';
  let full = (dir ? `${dir}/${importPath}` : importPath);
  full = full.replace(/\/+/g, '/').replace(/\/\.\//g, '/').replace(/^\.\//, '');

  if (fileMap.has(full)) return full;
  for (const ext of ['.jsx', '.tsx', '.js', '.ts']) {
    if (fileMap.has(full + ext)) return full + ext;
  }
  for (const ext of ['.jsx', '.tsx', '.js', '.ts']) {
    const idx = `${full}/index${ext}`;
    if (fileMap.has(idx)) return idx;
  }
  return null;
}
