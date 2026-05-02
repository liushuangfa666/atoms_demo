'use client';

import { Agent } from '@/lib/types';

interface Props {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showName?: boolean;
}

const sizeMap = { sm: 'w-6 h-6 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-14 h-14 text-xl' };

export default function AgentAvatar({ agent, size = 'md', onClick, showName }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold text-[#111] transition-transform hover:scale-110`}
        style={{ backgroundColor: agent.color }}
        title={`${agent.name} - ${agent.title}`}
      >
        {agent.initial}
      </button>
      {showName && <span className="text-xs text-text-secondary">{agent.name}</span>}
    </div>
  );
}
