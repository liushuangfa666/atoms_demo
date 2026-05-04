'use client';

interface Props {
  activeTab: 'preview' | 'code' | 'terminal';
  onTabChange: (tab: 'preview' | 'code' | 'terminal') => void;
}

export default function TabBar({ activeTab, onTabChange }: Props) {
  const tabs = [
    { id: 'preview' as const, label: '预览', icon: '👁' },
    { id: 'code' as const, label: '代码', icon: '📄' },
    { id: 'terminal' as const, label: '终端', icon: '⌨' },
  ];

  return (
    <div className="flex items-center gap-1 px-3 py-1 bg-bg-sidebar border-b border-border">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-bg-card text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
