'use client';

import { Template } from '@/lib/types';

interface Props {
  template: Template;
  onRemix: (template: Template) => void;
}

export default function TemplateCard({ template, onRemix }: Props) {
  return (
    <button
      onClick={() => onRemix(template)}
      className="bg-bg-card hover:bg-bg-hover rounded-lg overflow-hidden text-left transition-colors group"
    >
      <div className="h-28" style={{ background: template.gradient }} />
      <div className="p-3">
        <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">
          {template.name}
        </p>
        <p className="text-xs text-text-tertiary mt-1">{template.usageCount} 次使用</p>
      </div>
    </button>
  );
}
