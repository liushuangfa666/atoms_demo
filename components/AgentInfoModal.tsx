'use client';

import { Agent } from '@/lib/types';

interface Props {
  agent: Agent | null;
  onClose: () => void;
}

export default function AgentInfoModal({ agent, onClose }: Props) {
  if (!agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-text-tertiary hover:text-white text-xl">
          ✕
        </button>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-[#111]"
            style={{ backgroundColor: agent.color }}
          >
            {agent.initial}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
            <p className="text-sm text-text-secondary">{agent.title}</p>
          </div>
        </div>
        <p className="text-sm text-[#ccc] mb-4">{agent.description}</p>
        <div>
          <p className="text-xs text-text-secondary mb-2">核心能力</p>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map(cap => (
              <span key={cap} className="text-xs bg-[#1e3a5f] text-blue-400 px-3 py-1 rounded-full">
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
