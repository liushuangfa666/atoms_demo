'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  mode: 'legacy' | 'webcontainer' | 'server';
  code?: string;
  previewUrl?: string | null;
  isLoading?: boolean;
}

export default function PreviewPanel({ mode, code, previewUrl, isLoading }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [legacyUrl, setLegacyUrl] = useState('');
  const prevUrlRef = useRef('');

  // Legacy mode: POST HTML to API route
  useEffect(() => {
    if (mode !== 'legacy' || !code) {
      setLegacyUrl('');
      return;
    }

    let cancelled = false;
    const html = code.replace(
      /(<script\s+src=["'])https:\/\/cdn\.tailwindcss\.com\/?["']/g,
      '$1/tailwind.js"'
    );

    fetch('/api/preview', { method: 'POST', body: html })
      .then(r => r.json())
      .then(({ id }) => {
        if (!cancelled) {
          const url = `/api/preview?id=${id}`;
          prevUrlRef.current = url;
          setLegacyUrl(url);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [mode, code]);

  const content = (
    <div className="h-full flex flex-col bg-white rounded-lg overflow-hidden">
      {/* Browser Chrome */}
      <div className="bg-[#f1f5f9] px-3 py-1.5 flex items-center gap-2 border-b border-[#e2e8f0]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
        </div>
        <div className="flex-1 bg-white rounded px-2 py-0.5 text-[10px] text-[#666]">预览</div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="text-[10px] text-[#666] hover:text-[#333] px-1"
        >
          {isFullscreen ? '✕' : '⛶'}
        </button>
      </div>
      {/* iframe */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
          <div className="text-center">
            <div className="text-2xl mb-2 animate-spin">⚙️</div>
            <p className="text-sm text-[#94a3b8]">安装依赖中...</p>
          </div>
        </div>
      ) : mode === 'server' && previewUrl ? (
        <iframe
          src={previewUrl}
          className="flex-1 w-full border-none"
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      ) : mode === 'webcontainer' && previewUrl ? (
        <iframe
          src={previewUrl}
          className="flex-1 w-full border-none"
          title="Preview"
        />
      ) : mode === 'legacy' && legacyUrl ? (
        <iframe
          src={legacyUrl}
          className="flex-1 w-full border-none"
          title="Preview"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
          <div className="text-center">
            <div className="text-4xl mb-3">🏗️</div>
            <p className="text-sm text-[#94a3b8]">生成的应用将在这里预览</p>
          </div>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-page p-4">
        <div className="h-full">{content}</div>
      </div>
    );
  }

  return <div className="h-full">{content}</div>;
}
