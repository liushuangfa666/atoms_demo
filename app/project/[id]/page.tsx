'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ChatPanel from '@/components/ChatPanel';
import PreviewPanel from '@/components/PreviewPanel';
import AgentInfoModal from '@/components/AgentInfoModal';
import { getProject, updateProject } from '@/lib/storage';
import { Message, Project, Agent } from '@/lib/types';

export default function ProjectEditor() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [initialPromptSent, setInitialPromptSent] = useState(false);

  const saveMessages = useCallback((msgs: Message[], newCode?: string) => {
    const updates: Partial<Project> = { messages: msgs };
    if (newCode !== undefined) updates.currentCode = newCode;
    const updated = updateProject(projectId, updates);
    if (updated) setProject(updated);
  }, [projectId]);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveMessages(newMessages);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) throw new Error('API request failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'agent_done') {
              const agentMsg: Message = {
                id: `agent-${data.agent}-${Date.now()}`,
                role: data.agent as Message['role'],
                content: data.fullText,
                timestamp: new Date().toISOString(),
              };
              newMessages.push(agentMsg);
              setMessages([...newMessages]);
            }

            if (data.type === 'code_generated') {
              setCode(data.code);
              saveMessages([...newMessages], data.code);
            }

            if (data.type === 'error') {
              const errorMsg: Message = {
                id: `error-${Date.now()}`,
                role: 'mike' as const,
                content: `出错了: ${data.message}`,
                timestamp: new Date().toISOString(),
              };
              newMessages.push(errorMsg);
              setMessages([...newMessages]);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (error) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'mike' as const,
        content: `请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date().toISOString(),
      };
      const updated = [...newMessages, errorMsg];
      setMessages(updated);
      saveMessages(updated);
    } finally {
      setIsGenerating(false);
    }
  }, [messages, saveMessages]);

  // Load project
  useEffect(() => {
    const p = getProject(projectId);
    if (p) {
      setProject(p);
      setMessages(p.messages);
      setCode(p.currentCode);
    }
  }, [projectId]);

  // Auto-send template prompt
  useEffect(() => {
    if (initialPromptSent || messages.length > 0 || !project) return;
    const prompt = searchParams.get('prompt');
    if (prompt) {
      setInitialPromptSent(true);
      handleSendMessage(prompt);
    }
  }, [project, initialPromptSent, messages.length, searchParams, handleSendMessage]);

  if (!project) {
    return <div className="flex items-center justify-center h-full text-text-tertiary">项目不存在</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/projects')} className="text-text-secondary hover:text-white text-sm">
            ← 返回
          </button>
          <span className="text-sm font-semibold text-white">{project.name}</span>
          <span className="text-xs bg-[#1e3a5f] text-blue-400 px-2 py-0.5 rounded">
            {project.mode === 'team' ? '团队模式' : '工程师模式'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">
            {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-border">
          <ChatPanel
            messages={messages}
            isGenerating={isGenerating}
            onSendMessage={handleSendMessage}
            onAgentClick={agent => setSelectedAgent(agent)}
          />
        </div>
        <div className="w-1/2 p-3">
          <PreviewPanel code={code} />
        </div>
      </div>

      <AgentInfoModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
}
