'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, Agent } from '@/lib/types';
import { agents } from '@/lib/agents';

interface Props {
  messages: Message[];
  isGenerating: boolean;
  progressLabel?: string;
  streamingTokens?: string;
  streamingAgent?: string;
  onSendMessage: (content: string) => void;
  onAgentClick: (agent: Agent) => void;
}

function getAgentForRole(role: string): Agent | null {
  if (role in agents) return agents[role as keyof typeof agents];
  return null;
}

export default function ChatPanel({ messages, isGenerating, progressLabel, streamingTokens, streamingAgent, onSendMessage, onAgentClick }: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [foldedMessages, setFoldedMessages] = useState<Set<string>>(new Set());
  const prevMsgIdsRef = useRef<Set<string>>(new Set());

  // Auto-fold new tool_call/compression messages after a delay (show first, then fold)
  useEffect(() => {
    const newFoldable: string[] = [];
    messages.forEach(m => {
      if ((m.type === 'tool_call' || m.type === 'compression') && !prevMsgIdsRef.current.has(m.id)) {
        newFoldable.push(m.id);
      }
    });
    prevMsgIdsRef.current = new Set(messages.map(m => m.id));

    if (newFoldable.length > 0) {
      const timer = setTimeout(() => {
        setFoldedMessages(prev => {
          const next = new Set(prev);
          newFoldable.forEach(id => next.add(id));
          return next;
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const toggleFold = (id: string) => {
    setFoldedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingTokens]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput('');
  };

  // Get agent info for streaming bubble
  const streamAgentInfo = streamingAgent ? getAgentForRole(streamingAgent) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isGenerating && (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-tertiary text-sm">描述你想构建的应用，AI 团队将为你服务</p>
          </div>
        )}
        {messages.map(msg => {
          const agent = getAgentForRole(msg.role);
          const isUser = msg.role === 'user';
          const isCollapsible = msg.type === 'tool_call' || msg.type === 'compression';
          const isFolded = foldedMessages.has(msg.id);

          return (
            <div key={msg.id} className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              {msg.type === 'compression' ? (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-sm">
                  🗜️
                </div>
              ) : agent ? (
                <button
                  onClick={() => onAgentClick(agent)}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-[#111] hover:scale-110 transition-transform"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.initial}
                </button>
              ) : (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                  U
                </div>
              )}

              {/* Content */}
              {isCollapsible ? (
                <div className={`min-w-0 max-w-[calc(100%-44px)] rounded-2xl border overflow-hidden ${
                  msg.type === 'compression'
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-bg-card border-border'
                }`}>
                  <button
                    onClick={() => toggleFold(msg.id)}
                    className="w-full px-4 py-2.5 flex items-center gap-2 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="text-[10px] text-text-tertiary">{isFolded ? '▶' : '▼'}</span>
                    {agent && (
                      <span className="text-xs font-medium" style={{ color: agent.color }}>{agent.name}</span>
                    )}
                    <span className="text-xs text-text-secondary flex-1 truncate">
                      {msg.summary || '工具调用'}
                    </span>
                  </button>
                  {!isFolded && (
                    <div className="px-4 pb-3 text-sm text-text-secondary border-t border-border/50 pt-2 whitespace-pre-wrap break-words leading-relaxed max-h-96 overflow-y-auto">
                      {msg.content}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`min-w-0 max-w-[calc(100%-44px)] rounded-2xl px-4 py-2.5 ${
                  isUser
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-bg-card border border-border rounded-bl-sm'
                }`}>
                  {agent && !isUser && <p className="text-xs text-text-secondary mb-1 font-medium">{agent.name}</p>}
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                </div>
              )}
            </div>
          );
        })}
        {/* Streaming token bubble */}
        {isGenerating && streamingTokens && streamAgentInfo && (
          <div className="flex gap-3 items-start">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-[#111]"
              style={{ backgroundColor: streamAgentInfo.color }}
            >
              {streamAgentInfo.initial}
            </div>
            <div className="min-w-0 max-w-[calc(100%-44px)] bg-bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2.5">
              <p className="text-xs text-text-secondary mb-1 font-medium">{streamAgentInfo.name}</p>
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {streamingTokens}
                <span className="inline-block animate-pulse">|</span>
              </p>
            </div>
          </div>
        )}
        {/* Fallback generating indicator (when no streaming tokens yet) */}
        {isGenerating && !streamingTokens && (
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-agent-alex flex items-center justify-center font-bold text-sm text-[#111]">
              A
            </div>
            <div className="bg-bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2.5">
              <span className="text-sm text-text-secondary typing-cursor">{progressLabel || '正在生成'}</span>
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
            className="flex-1 bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
            className="bg-primary text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
