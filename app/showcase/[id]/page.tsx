'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { showcases } from '@/lib/showcases';
import { createProjectFromShowcase } from '@/lib/storage';
import FileTree from '@/components/FileTree';
import CodeEditor from '@/components/CodeEditor';
import { ProjectFile } from '@/lib/types';

export default function ShowcasePreview() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const showcase = showcases.find(s => s.id === id);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Create preview URL via API route
  useEffect(() => {
    if (!showcase) return;
    fetch('/api/preview', { method: 'POST', body: showcase.htmlCode })
      .then(r => r.json())
      .then(({ id }) => setPreviewUrl(`/api/preview?id=${id}`))
      .catch(() => {});
  }, [showcase]);

  if (!showcase) {
    return (
      <div className="flex items-center justify-center h-screen text-text-tertiary">
        项目不存在
      </div>
    );
  }

  const handleCopyAsProject = async () => {
    const project = await createProjectFromShowcase(
      showcase.name,
      showcase.recommendedMode,
      showcase.files,
      showcase.messages,
    );
    router.push(`/project/${project.id}`);
  };

  const files: ProjectFile[] = showcase.files.length > 0
    ? showcase.files
    : [];

  const selectedFileData = files.find(f => f.path === selectedFile) || null;

  return (
    <div className="h-screen flex flex-col bg-bg-page">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-bg-card">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/explore')}
            className="text-text-secondary hover:text-white text-sm transition-colors"
          >
            ← 返回发现
          </button>
          <span className="text-sm font-semibold text-white">{showcase.name}</span>
          <span className="text-xs text-text-tertiary">{showcase.description}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded ${
            showcase.recommendedMode === 'engineer'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            {showcase.recommendedMode === 'engineer' ? '工程师模式' : '团队模式'}推荐
          </span>
          <span className="text-[10px] text-text-tertiary">
            React + Vite · {files.length} 文件
          </span>
          <button
            onClick={handleCopyAsProject}
            className="text-xs bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            复制为我的项目
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border bg-bg-card">
        <button
          onClick={() => setActiveTab('preview')}
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'preview' ? 'bg-bg-hover text-white' : 'text-text-tertiary hover:text-white'
          }`}
        >
          预览
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'code' ? 'bg-bg-hover text-white' : 'text-text-tertiary hover:text-white'
          }`}
        >
          代码 ({files.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-none"
              title={showcase.name}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
              加载预览中...
            </div>
          )
        ) : (
          <div className="flex h-full">
            <div className="w-56 border-r border-border bg-bg-sidebar overflow-y-auto">
              <FileTree
                files={files}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              {selectedFileData ? (
                <CodeEditor file={selectedFileData} />
              ) : (
                <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
                  选择文件查看代码
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
