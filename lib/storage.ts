import { Project } from './types';

const PROJECTS_KEY = 'atoms_projects';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PROJECTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getProject(id: string): Project | null {
  const projects = getProjects();
  return projects.find(p => p.id === id) || null;
}

export function createProject(name: string, mode: 'engineer' | 'team' = 'team'): Project {
  const project: Project = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode,
    messages: [],
    currentCode: '',
  };
  const projects = getProjects();
  projects.unshift(project);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return project;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return null;
  projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return projects[index];
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter(p => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}
