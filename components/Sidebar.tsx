'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/projects', label: '项目', icon: '📁' },
  { href: '/explore', label: '发现', icon: '🔍' },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Hide sidebar on project editor pages
  if (pathname.startsWith('/project/') || pathname.startsWith('/showcase/')) return null;

  return (
    <aside className="w-16 bg-bg-sidebar flex flex-col items-center py-4 gap-2 border-r border-border">
      <Link href="/" className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4">
        A
      </Link>
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
            pathname === item.href ? 'bg-bg-hover' : 'hover:bg-bg-hover'
          }`}
          title={item.label}
        >
          {item.icon}
        </Link>
      ))}
    </aside>
  );
}
