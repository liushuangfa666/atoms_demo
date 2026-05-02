export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  mode: 'engineer' | 'team';
  messages: Message[];
  currentCode: string;
}

export interface Message {
  id: string;
  role: 'user' | 'mike' | 'emma' | 'alex';
  content: string;
  timestamp: string;
}

export interface Agent {
  id: 'mike' | 'emma' | 'alex';
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
