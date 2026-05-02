'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AgentAvatar from '@/components/AgentAvatar';
import { agents } from '@/lib/agents';
import { getProjects, createProject } from '@/lib/storage';
import { Project, Agent } from '@/lib/types';
import AgentInfoModal from '@/components/AgentInfoModal';

export default function Dashboard() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    setRecentProjects(getProjects().slice(0, 3));
  }, []);

  const handleCreate = () => {
    const name = input.trim() || '未命名项目';
    const project = createProject(name);
    router.push(`/project/${project.id}`);
  };

  const agentList = Object.values(agents);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Atoms Demo</h1>
          <p className="text-sm text-text-secondary">你的 AI 应用构建平台</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-bg-card px-3 py-1.5 rounded-lg">积分: 100</span>
          <button
            onClick={() => {
              const project = createProject('新项目');
              router.push(`/project/${project.id}`);
            }}
            className="text-xs bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-hover transition-colors"
          >
            新建项目
          </button>
        </div>
      </div>

      {/* Agent Avatars */}
      <div className="mb-8">
        <p className="text-xs text-text-secondary mb-3">你的 AI 团队</p>
        <div className="flex gap-3">
          {agentList.map(agent => (
            <AgentAvatar key={agent.id} agent={agent} size="md" showName onClick={() => setSelectedAgent(agent)} />
          ))}
        </div>
      </div>

      {/* Hero Input */}
      <div className="bg-gradient-to-br from-bg-card to-[#16213e] rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-1">把想法变成产品</h2>
        <p className="text-sm text-text-secondary mb-4">描述你的想法，AI 团队帮你构建</p>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="描述你想构建的应用..."
            className="flex-1 bg-bg-page border border-border rounded-lg px-4 py-3 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleCreate}
            className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            开始构建
          </button>
        </div>
      </div>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary mb-3">最近项目</p>
          <div className="grid grid-cols-3 gap-4">
            {recentProjects.map(project => (
              <button
                key={project.id}
                onClick={() => router.push(`/project/${project.id}`)}
                className="bg-bg-card hover:bg-bg-hover rounded-lg p-4 text-left transition-colors"
              >
                <div className="h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg mb-3" />
                <p className="text-sm font-medium text-white truncate">{project.name}</p>
                <p className="text-xs text-text-tertiary mt-1">
                  {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <AgentInfoModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
}
