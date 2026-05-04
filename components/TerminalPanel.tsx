'use client';

import { useEffect, useRef } from 'react';

interface Props {
  output: string;
}

const ANSI_COLORS: Record<string, string> = {
  '30': '#4a4a4a', '31': '#ef4444', '32': '#22c55e', '33': '#eab308',
  '34': '#3b82f6', '35': '#a855f7', '36': '#06b6d4', '37': '#a1a1aa',
  '90': '#6b7280', '91': '#f87171', '92': '#4ade80', '93': '#facc15',
  '94': '#60a5fa', '95': '#c084fc', '96': '#22d3ee', '97': '#e5e5e5',
};

function renderAnsi(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\x1b\[([0-9;]*)m/g, (_match, codes: string) => {
      const codeList = codes.split(';');
      if (codeList.includes('0') || codes === '') return '</span>';
      for (const c of codeList) {
        if (ANSI_COLORS[c]) {
          return `<span style="color:${ANSI_COLORS[c]}">`;
        }
      }
      return '';
    });
}

export default function TerminalPanel({ output }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div
      ref={scrollRef}
      className="h-full w-full bg-[#0c0c0f] p-3 overflow-y-auto overflow-x-hidden"
    >
      <div
        className="font-mono text-xs leading-5 whitespace-pre-wrap break-all"
        style={{ color: '#a1a1aa' }}
        dangerouslySetInnerHTML={{
          __html: output
            ? renderAnsi(output)
            : '<span style="color:#6b7280">等待输入...</span>',
        }}
      />
    </div>
  );
}
