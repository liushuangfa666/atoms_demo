export interface ProjectFile {
  path: string;
  content: string;
  language: string;
}

/** Detect project type from file structure */
export function detectProjectType(files: ProjectFile[]): Project['projectType'] {
  const paths = files.map(f => f.path);
  if (paths.includes('package.json') && paths.some(p => p.includes('vite.config'))) {
    return 'react-vite';
  }
  return 'single-html';
}

export interface QAResult {
  severity: 'error' | 'warning' | 'info';
  category: 'functionality' | 'accessibility' | 'security' | 'style';
  message: string;
  file?: string;
  suggestion?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  mode: 'engineer' | 'team';
  messages: Message[];
  currentCode: string;
  files: ProjectFile[];
  projectType: 'single-html' | 'react-vite' | 'fullstack';
  previewHtml?: string;  // Pre-built HTML for instant preview
  userId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'mike' | 'emma' | 'alex' | 'qa';
  content: string;
  timestamp: string;
  type?: 'text' | 'tool_call' | 'compression';
  summary?: string;
  toolName?: string;
}

export interface Agent {
  id: 'mike' | 'emma' | 'alex' | 'qa';
  name: string;
  title: string;
  color: string;
  initial: string;
  description: string;
  capabilities: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  gradient: string;
  usageCount: number;
  prompt: string;
}

export interface ShowcaseProject {
  id: string;
  name: string;
  description: string;
  category: string;
  gradient: string;
  usageCount: number;
  prompt: string;
  htmlCode: string;
  files: ProjectFile[];
  messages: Message[];
  recommendedMode: 'engineer' | 'team';
}
