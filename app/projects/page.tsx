'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects, deleteProject } from '@/lib/storage';
import { Project } from '@/lib/types';

function ProjectThumbnail({ projectType, messageCount }: { projectType: string; messageCount: number }) {
  const gradients: Record<string, string> = {
    'react-vite': 'from-blue-500/20 to-cyan-500/20',
    'fullstack': 'from-purple-500/20 to-pink-500/20',
    'single-html': 'from-amber-500/20 to-orange-500/20',
  };
  const icons: Record<string, string> = {
    'react-vite': '⚛️',
    'fullstack': '🔧',
    'single-html': '📝',
  };
  const gradient = gradients[projectType] || gradients['single-html'];
  const icon = icons[projectType] || icons['single-html'];

  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
      <span className="text-3xl opacity-70">{icon}</span>
      {messageCount > 0 && (
        <span className="text-[10px] text-text-tertiary">{messageCount} 条消息</span>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects().then(data => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-white">我的项目</h1>
        <button
          onClick={() => router.push('/')}
          className="text-xs bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-hover transition-colors"
        >
          新建项目
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-sm text-text-secondary">加载中...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-sm text-text-secondary">还没有项目</p>
          <p className="text-xs text-text-tertiary mt-1">点击"新建项目"开始创建</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => { router.push(`/project/${project.id}`); }}
              className="bg-bg-card hover:bg-bg-hover rounded-lg p-4 cursor-pointer transition-colors group relative"
            >
              <div className="h-28 rounded-lg mb-3 overflow-hidden">
                <ProjectThumbnail projectType={project.projectType || 'single-html'} messageCount={project.messages.length} />
              </div>
              <p className="text-sm font-medium text-white truncate">{project.name}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-text-tertiary">
                  {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                </p>
                <span className="text-xs text-text-tertiary">
                  {project.messages.length} 条消息
                </span>
              </div>
              <button
                onClick={e => handleDelete(project.id, e)}
                className="absolute top-2 right-2 text-text-tertiary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs z-10"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
