import * as esbuild from 'esbuild';
import { ProjectFile } from './types';
import { existsSync } from 'fs';
import { join } from 'path';

const VIRTUAL_ENTRY = 'virtual-entry.jsx';
const VIRTUAL_NS = 'virtual';

// Common libraries that the AI often uses — provide empty stubs if not installed locally.
// This prevents build failures and lets the preview render (components may be missing but won't crash).
const STUBBED_LIBS: Record<string, string> = {
  'react-router-dom': `export function useNavigate(){return ()=>{}} export function useSearchParams(){return [{},()=>{}]} export function Link(props){return props.children||null} export function BrowserRouter(props){return props.children||null} export function Routes(props){return props.children||null} export function Route(props){return null} export function Navigate(){return null} export function useLocation(){return {pathname:'/'}} export function useParams(){return {}}`,
  'react-router': `export function useNavigate(){return ()=>{}} export function useSearchParams(){return [{},()=>{}]} export function Link(props){return props.children||null} export function BrowserRouter(props){return props.children||null} export function Routes(props){return props.children||null} export function Route(props){return null}`,
  'recharts': `export function PieChart(props){return props.children||null} export function Pie(props){return null} export function Cell(props){return null} export function ResponsiveContainer(props){return props.children||null} export function BarChart(props){return props.children||null} export function Bar(props){return null} export function XAxis(props){return null} export function YAxis(props){return null} export function Tooltip(props){return null} export function Legend(props){return null} export function CartesianGrid(props){return null} export function LineChart(props){return props.children||null} export function Line(props){return null} export function AreaChart(props){return props.children||null} export function Area(props){return null} export function RadarChart(props){return props.children||null} export function Radar(props){return null} export function PolarAngleAxis(props){return null} export function PolarRadiusAxis(props){return null}`,
  'framer-motion': `export function motion(props){return props?.children||null} export function AnimatePresence(props){return props?.children||null} export function useAnimation(){return{start:()=>Promise.resolve()}}`,
  'axios': `export default{get:()=>Promise.resolve({data:{}}),post:()=>Promise.resolve({data:{}})}`,
  'zustand': `export function create(fn){return fn} export default function(fn){return fn}`,
  'date-fns': `export function format(){return ''} export function parseISO(){return new Date()} export function differenceInSeconds(){return 0}`,
  'react-countdown': `export default function Countdown(props){return props?.children||null}`,
  'chart.js': `export default{} export function Chart(){}`,
  'react-chartjs-2': `export function Doughnut(props){return null} export function Bar(props){return null} export function Line(props){return null} export function Pie(props){return null}`,
};

/**
 * Build a self-contained HTML preview from React project files using esbuild.
 * Installed deps (React, ReactDOM, lucide-react) are bundled inline.
 * Missing deps are stubbed out so the preview doesn't crash.
 * Tailwind classes are handled at runtime via /tailwind.js.
 */
export async function buildPreviewHtml(files: ProjectFile[]): Promise<string | null> {
  try {
    const fileMap = new Map(files.map(f => [f.path, f.content]));
    const resolveDir = process.cwd();

    // Find App entry point — check both root-level and frontend/ prefix
    const appPath = files.find(f =>
      f.path === 'src/App.jsx' || f.path === 'src/App.tsx' ||
      f.path === 'frontend/src/App.jsx' || f.path === 'frontend/src/App.tsx'
    )?.path;
    if (!appPath) return null;

    // For fullstack projects, only use frontend/ files for preview
    const isFrontend = appPath.startsWith('frontend/');
    const previewFiles = isFrontend
      ? files.filter(f => f.path.startsWith('frontend/')).map(f => ({
          ...f,
          path: f.path.replace(/^frontend\//, ''),
        }))
      : files;
    const previewFileMap = new Map(previewFiles.map(f => [f.path, f.content]));

    // Strip imports of libraries that we stub — the AI code imports them but we replace with stubs
    const stripBadImports: esbuild.Plugin = {
      name: 'strip-bad-imports',
      setup(build) {
        // For bare imports that aren't in node_modules and aren't in our virtual FS,
        // redirect to a stub module
        build.onResolve({ filter: /^[a-z@]/ }, (args) => {
          // Try to resolve from node_modules first
          const modPath = args.path;
          // Check if it exists in node_modules
          const modDir = join(resolveDir, 'node_modules', modPath);
          const modDirScoped = modPath.startsWith('@') ? join(resolveDir, 'node_modules', modPath.split('/').slice(0, 2).join('/')) : '';
          if (existsSync(modDir) || (modDirScoped && existsSync(modDirScoped))) {
            return undefined; // let esbuild handle it
          }
          // Check if we have a stub for it
          if (STUBBED_LIBS[modPath]) {
            return { path: `stub:${modPath}`, namespace: 'stub' };
          }
          // Try subpath matches (e.g., recharts/es6 or react-router-dom/dist)
          const topLevel = modPath.split('/')[0];
          if (STUBBED_LIBS[topLevel] && !STUBBED_LIBS[modPath]) {
            return { path: `stub:${topLevel}`, namespace: 'stub' };
          }
          return undefined; // let esbuild try
        });

        build.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => {
          const modPath = args.path.replace('stub:', '');
          const stub = STUBBED_LIBS[modPath] || STUBBED_LIBS[modPath.split('/')[0]] || '';
          return { contents: stub, loader: 'js', resolveDir };
        });
      },
    };

    // Synthesized entry — render App into #root
    const entryAppPath = isFrontend ? appPath.replace('frontend/', '') : appPath;
    const entryContent = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './${entryAppPath}';
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
          const resolved = resolveRelative(args.importer, args.path, previewFileMap);
          if (resolved) return { path: resolved, namespace: VIRTUAL_NS };
          return null;
        });

        // Load virtual files
        build.onLoad({ filter: /.*/, namespace: VIRTUAL_NS }, (args) => {
          if (args.path === VIRTUAL_ENTRY) {
            return { contents: entryContent, loader: 'jsx', resolveDir };
          }
          const content = previewFileMap.get(args.path);
          if (content !== undefined) {
            const ext = args.path.split('.').pop() || '';
            const loader: esbuild.Loader = ['jsx', 'tsx'].includes(ext) ? 'jsx' : 'js';
            return { contents: content, loader, resolveDir };
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
      plugins: [stripBadImports, virtualFs],
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
<meta name="viewport" content=device-width, initial-scale=1.0">
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
