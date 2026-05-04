import { Project, ProjectFile, Message, detectProjectType } from './types';

const PROJECTS_KEY = 'atoms_projects';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getUid(): string {
  if (typeof document === 'undefined') return 'anonymous';
  const match = document.cookie.match(/atoms_uid=([^;]+)/);
  return match ? match[1] : 'anonymous';
}

/** Check if API is reachable (Redis-backed) */
let apiAvailable: boolean | null = null;

async function checkApi(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  try {
    const res = await fetch('/api/projects', { method: 'GET', signal: AbortSignal.timeout(3000) });
    apiAvailable = res.ok || res.status !== 503;
  } catch {
    apiAvailable = false;
  }
  return apiAvailable;
}

/** Migrate old projects that lack files[] / projectType */
function migrateProject(p: Project): Project {
  if (!p.files || p.files.length === 0) {
    if (p.currentCode) {
      p.files = [{ path: 'index.html', content: p.currentCode, language: 'html' }];
    } else {
      p.files = [];
    }
  }
  if (!p.projectType || p.projectType === 'single-html' && p.files.length > 1) {
    // Auto-detect from file structure
    const detected = detectProjectType(p.files);
    if (detected !== p.projectType) {
      p.projectType = detected;
    }
  }
  return p;
}

// ─── localStorage helpers (fallback) ───

function localGetAll(): Project[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PROJECTS_KEY);
  if (!data) return [];
  const projects: Project[] = JSON.parse(data);
  let needsSave = false;
  for (const p of projects) {
    if (!p.files || !p.projectType) {
      migrateProject(p);
      needsSave = true;
    }
  }
  if (needsSave) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
  return projects;
}

function localSaveAll(projects: Project[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// ─── Public API (all async) ───

export async function getProjects(): Promise<Project[]> {
  const useApi = await checkApi();
  if (useApi) {
    try {
      // The list endpoint only returns metadata; fetch full projects
      const res = await fetch('/api/projects');
      if (res.ok) {
        const metaList = await res.json();
        // Fetch full project data for each
        const projects: Project[] = [];
        for (const meta of metaList) {
          const detailRes = await fetch(`/api/projects/${meta.id}`);
          if (detailRes.ok) {
            const project = await detailRes.json();
            projects.push(migrateProject(project));
          }
        }
        // Cache to localStorage
        localSaveAll(projects);
        return projects;
      }
    } catch {
      apiAvailable = false;
    }
  }
  return localGetAll();
}

export async function getProject(id: string): Promise<Project | null> {
  const useApi = await checkApi();
  if (useApi) {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const project = await res.json();
        return migrateProject(project);
      }
      if (res.status === 404) return null;
    } catch {
      apiAvailable = false;
    }
  }
  return localGetAll().find(p => p.id === id) || null;
}

export async function createProject(name: string, mode: 'engineer' | 'team' = 'engineer'): Promise<Project> {
  const project: Project = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode,
    messages: [],
    currentCode: '',
    files: [],
    projectType: 'react-vite',
    userId: getUid(),
  };

  const useApi = await checkApi();
  if (useApi) {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mode }),
      });
      if (res.ok || res.status === 201) {
        const saved = await res.json();
        // Cache locally
        const projects = localGetAll();
        projects.unshift(saved);
        localSaveAll(projects);
        return saved;
      }
    } catch {
      apiAvailable = false;
    }
  }

  // Fallback: localStorage only
  const projects = localGetAll();
  projects.unshift(project);
  localSaveAll(projects);
  return project;
}

export async function createProjectWithCode(name: string, mode: 'engineer' | 'team', initialCode: string): Promise<Project> {
  const project: Project = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode,
    messages: [],
    currentCode: initialCode,
    files: [{ path: 'index.html', content: initialCode, language: 'html' }],
    projectType: 'single-html',
    userId: getUid(),
  };

  const useApi = await checkApi();
  if (useApi) {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mode, initialCode }),
      });
      if (res.ok || res.status === 201) {
        const saved = await res.json();
        const projects = localGetAll();
        projects.unshift(saved);
        localSaveAll(projects);
        return saved;
      }
    } catch {
      apiAvailable = false;
    }
  }

  const projects = localGetAll();
  projects.unshift(project);
  localSaveAll(projects);
  return project;
}

export async function createProjectFromShowcase(
  name: string,
  mode: 'engineer' | 'team',
  files: ProjectFile[],
  messages: Message[],
): Promise<Project> {
  const htmlFile = files.find(f => f.path === 'index.html');
  const project: Project = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode,
    messages: messages.map(m => ({ ...m, id: `${Date.now()}-${m.id}` })),
    currentCode: htmlFile?.content || '',
    files,
    projectType: 'react-vite',
    userId: getUid(),
  };

  const useApi = await checkApi();
  if (useApi) {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mode,
          projectType: 'react-vite',
          files,
          messages: messages.map(m => ({ ...m, id: `${Date.now()}-${m.id}` })),
        }),
      });
      if (res.ok || res.status === 201) {
        const saved = await res.json();
        const localProjects = localGetAll();
        localProjects.unshift(saved);
        localSaveAll(localProjects);
        return saved;
      }
    } catch {
      apiAvailable = false;
    }
  }

  const localProjects = localGetAll();
  localProjects.unshift(project);
  localSaveAll(localProjects);
  return project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const useApi = await checkApi();
  if (useApi) {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        // Update local cache
        const projects = localGetAll();
        const idx = projects.findIndex(p => p.id === id);
        if (idx >= 0) {
          projects[idx] = updated;
          localSaveAll(projects);
        }
        return updated;
      }
    } catch {
      apiAvailable = false;
    }
  }

  // Fallback: localStorage
  const projects = localGetAll();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return null;
  projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
  localSaveAll(projects);
  return projects[index];
}

export async function deleteProject(id: string): Promise<void> {
  const useApi = await checkApi();
  if (useApi) {
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    } catch {
      apiAvailable = false;
    }
  }

  // Always update localStorage (cache invalidation)
  const projects = localGetAll().filter(p => p.id !== id);
  localSaveAll(projects);
}
