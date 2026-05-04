'use client';

import { useState, useEffect } from 'react';

interface Props {
  code: string;
  width?: number;
  height?: number;
  scale?: number;
}

export default function PreviewThumbnail({ code, width = 800, height = 500, scale = 0.2 }: Props) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!code) return;
    const html = code.replace(
      /(<script\s+src=["'])https:\/\/cdn\.tailwindcss\.com\/?["']/g,
      '$1/tailwind.js"'
    );
    fetch('/api/preview', { method: 'POST', body: html })
      .then(r => r.json())
      .then(({ id }) => setPreviewUrl(`/api/preview?id=${id}`))
      .catch(() => {});
  }, [code]);

  if (!previewUrl) {
    return (
      <div
        className="bg-gray-100 flex items-center justify-center"
        style={{ width: width * scale, height: height * scale }}
      >
        <span className="text-gray-300 text-xs">...</span>
      </div>
    );
  }

  return (
    <div style={{ width: width * scale, height: height * scale }} className="overflow-hidden">
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <iframe
          src={previewUrl}
          className="w-full h-full border-none pointer-events-none"
          title="Preview"
        />
      </div>
    </div>
  );
}
