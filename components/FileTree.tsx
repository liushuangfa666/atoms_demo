'use client';

import { ProjectFile } from '@/lib/types';

interface Props {
  files: ProjectFile[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}

function getFileIcon(path: string): string {
  const ext = path.split('.').pop() || '';
  const icons: Record<string, string> = {
    ts: '📘', tsx: '⚛️', js: '📜', jsx: '⚛️',
    html: '🌐', css: '🎨', json: '📋', md: '📝',
    py: '🐍', txt: '📄', yaml: '⚙️', yml: '⚙️',
    svg: '🖼️', png: '🖼️', jpg: '🖼️',
  };
  return icons[ext] || '📄';
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existing = current.find(n => n.name === part);

      if (existing) {
        current = existing.children;
      } else {
        const fullPath = parts.slice(0, i + 1).join('/');
        const node: TreeNode = {
          name: part,
          path: fullPath,
          isDir: !isFile,
          children: [],
        };
        current.push(node);
        current = node.children;
      }
    }
  }

  // Sort: directories first, then alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.isDir) sortNodes(node.children);
    }
  };
  sortNodes(root);

  return root;
}

function TreeItem({ node, depth, selectedFile, onSelectFile }: {
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}) {
  const isExpanded = true; // Keep simple for now - all expanded

  return (
    <div>
      <button
        onClick={() => !node.isDir && onSelectFile(node.path)}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-bg-hover transition-colors text-left ${
          selectedFile === node.path ? 'bg-bg-hover text-text-primary' : 'text-text-secondary'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.isDir ? (
          <span className="text-[10px]">📁</span>
        ) : (
          <span className="text-[10px]">{getFileIcon(node.path)}</span>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {node.isDir && isExpanded && node.children.map(child => (
        <TreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  );
}

export default function FileTree({ files, selectedFile, onSelectFile }: Props) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary text-xs">
        暂无文件
      </div>
    );
  }

  const tree = buildTree(files);

  return (
    <div className="h-full overflow-y-auto">
      {tree.map(node => (
        <TreeItem
          key={node.path}
          node={node}
          depth={0}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  );
}
