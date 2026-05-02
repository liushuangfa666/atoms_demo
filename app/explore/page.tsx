'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TemplateCard from '@/components/TemplateCard';
import { templates, categories } from '@/lib/templates';
import { createProject } from '@/lib/storage';
import { Template } from '@/lib/types';

export default function ExplorePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('全部');

  const filtered = activeCategory === '全部'
    ? templates
    : templates.filter(t => t.category === activeCategory);

  const handleRemix = (template: Template) => {
    const project = createProject(template.name);
    router.push(`/project/${project.id}?prompt=${encodeURIComponent(template.prompt)}`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold text-white mb-6">发现灵感</h1>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-4 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-white'
                : 'bg-bg-card text-text-secondary hover:bg-bg-hover'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map(template => (
          <TemplateCard key={template.id} template={template} onRemix={handleRemix} />
        ))}
      </div>
    </div>
  );
}
