'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProjects, deleteProject } from '@/lib/storage';
import { Project } from '@/lib/types';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProject(id);
    setProjects(getProjects());
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

      {projects.length === 0 ? (
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
              onClick={() => router.push(`/project/${project.id}`)}
              className="bg-bg-card hover:bg-bg-hover rounded-lg p-4 cursor-pointer transition-colors group relative"
            >
              <div className="h-20 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg mb-3 flex items-center justify-center">
                {project.currentCode ? (
                  <span className="text-2xl">✅</span>
                ) : (
                  <span className="text-2xl">📝</span>
                )}
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
                className="absolute top-2 right-2 text-text-tertiary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
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
