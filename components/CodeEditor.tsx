'use client';

import { ProjectFile } from '@/lib/types';

interface Props {
  file: ProjectFile | null;
}

export default function CodeEditor({ file }: Props) {
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary text-xs">
        选择文件查看代码
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-bg-sidebar">
        <span className="text-[10px]">{file.path}</span>
        <span className="text-[10px] text-text-tertiary ml-auto">{file.language}</span>
      </div>
      <div className="flex-1 overflow-auto">
        <pre className="p-3 text-xs leading-relaxed font-mono">
          <code>{file.content}</code>
        </pre>
      </div>
    </div>
  );
}
