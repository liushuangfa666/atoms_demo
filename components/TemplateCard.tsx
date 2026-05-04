'use client';

import { useState, useEffect } from 'react';
import { ShowcaseProject } from '@/lib/types';

interface Props {
  showcase: ShowcaseProject;
  onClick: (showcase: ShowcaseProject) => void;
}

export default function ShowcaseCard({ showcase, onClick }: Props) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetch('/api/preview', { method: 'POST', body: showcase.htmlCode })
      .then(r => r.json())
      .then(({ id }) => setPreviewUrl(`/api/preview?id=${id}`))
      .catch(() => {});
  }, [showcase.htmlCode]);

  return (
    <button
      onClick={() => onClick(showcase)}
      className="bg-bg-card hover:bg-bg-hover rounded-lg overflow-hidden text-left transition-colors group"
    >
      <div className="h-28 overflow-hidden relative bg-white">
        <div
          className="origin-top-left"
          style={{
            width: '800px',
            height: '500px',
            transform: 'scale(0.2)',
            transformOrigin: 'top left',
          }}
        >
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-none pointer-events-none"
              title={showcase.name}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-300 text-sm">加载中...</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">
          {showcase.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-text-tertiary">{showcase.usageCount} 次使用</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            showcase.recommendedMode === 'engineer'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            {showcase.recommendedMode === 'engineer' ? '工程师' : '团队'}
          </span>
        </div>
      </div>
    </button>
  );
}
