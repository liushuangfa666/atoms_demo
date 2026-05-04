'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShowcaseCard from '@/components/TemplateCard';
import { showcases, categories } from '@/lib/showcases';
import { ShowcaseProject } from '@/lib/types';

export default function ExplorePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('全部');

  const filtered = activeCategory === '全部'
    ? showcases
    : showcases.filter(s => s.category === activeCategory);

  const handleCardClick = (showcase: ShowcaseProject) => {
    router.push(`/showcase/${showcase.id}`);
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

      {/* Showcase Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map(showcase => (
          <ShowcaseCard key={showcase.id} showcase={showcase} onClick={handleCardClick} />
        ))}
      </div>
    </div>
  );
}
