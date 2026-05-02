'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, Agent } from '@/lib/types';
import { agents } from '@/lib/agents';

interface Props {
  messages: Message[];
  isGenerating: boolean;
  onSendMessage: (content: string) => void;
  onAgentClick: (agent: Agent) => void;
}

function getAgentForRole(role: string): Agent | null {
  if (role in agents) return agents[role as keyof typeof agents];
  return null;
}

export default function ChatPanel({ messages, isGenerating, onSendMessage, onAgentClick }: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-tertiary text-sm">描述你想构建的应用，AI 团队将为你服务</p>
          </div>
        )}
        {messages.map(msg => {
          const agent = getAgentForRole(msg.role);
          return (
            <div key={msg.id} className="flex gap-3 items-start">
              {agent ? (
                <button
                  onClick={() => onAgentClick(agent)}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-[#111] hover:scale-110 transition-transform"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.initial}
                </button>
              ) : (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-xs">
                  你
                </div>
              )}
              <div className="bg-bg-card rounded-lg px-3 py-2 max-w-[85%]">
                {agent && <p className="text-xs text-text-secondary mb-1">{agent.name}</p>}
                <p className="text-sm text-text-primary whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          );
        })}
        {isGenerating && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-agent-alex flex items-center justify-center font-bold text-sm text-[#111]">
              A
            </div>
            <div className="bg-bg-card rounded-lg px-3 py-2">
              <span className="text-sm text-text-secondary typing-cursor">正在生成</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="输入你的需求..."
            disabled={isGenerating}
            className="flex-1 bg-bg-sidebar border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
            className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
