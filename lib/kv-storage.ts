import Redis from 'ioredis';
import { Project } from './types';

const LIST_KEY = (userId: string) => `atoms_projects:${userId}`;
const projectKey = (id: string) => `atoms_project:${id}`;

interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  mode: 'engineer' | 'team';
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (!process.env.REDIS_URL) return null;
  _redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });
  return _redis;
}

export function isKVAvailable(): boolean {
  return !!process.env.REDIS_URL;
}

/** Extract userId from request cookie */
export function getUserId(request?: { cookies?: { get(name: string): { value: string } | undefined } }): string {
  if (!request?.cookies) return 'anonymous';
  const cookie = request.cookies.get('atoms_uid');
  return cookie?.value || 'anonymous';
}

export async function getProjects(userId: string): Promise<ProjectMeta[]> {
  const r = getRedis();
  if (!r) return [];
  const data = await r.get(LIST_KEY(userId));
  return data ? JSON.parse(data) : [];
}

export async function getProject(id: string): Promise<Project | null> {
  const r = getRedis();
  if (!r) return null;
  const data = await r.get(projectKey(id));
  return data ? JSON.parse(data) : null;
}

export async function createProject(
  name: string,
  mode: 'engineer' | 'team' = 'engineer',
  userId: string = 'anonymous',
): Promise<Project> {
  const project: Project = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode,
    messages: [],
    currentCode: '',
    files: [],
    projectType: 'single-html',
    userId,
  };
  await saveProject(project, userId);
  return project;
}

export async function createProjectWithCode(
  name: string,
  mode: 'engineer' | 'team',
  initialCode: string,
  userId: string = 'anonymous',
): Promise<Project> {
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
    userId,
  };
  await saveProject(project, userId);
  return project;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>,
  userId: string = 'anonymous',
): Promise<Project | null> {
  const existing = await getProject(id);
  if (!existing) return null;

  const updated: Project = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveProject(updated, userId);
  return updated;
}

export async function deleteProject(id: string, userId: string = 'anonymous'): Promise<void> {
  const r = getRedis();
  if (!r) return;
  const list = await getProjects(userId);
  const filtered = list.filter(p => p.id !== id);
  await r.set(LIST_KEY(userId), JSON.stringify(filtered));
  await r.del(projectKey(id));
}

// Lua script for atomic saveProject: read list, upsert meta, write list + project data
const SAVE_PROJECT_LUA = `
local listKey = KEYS[1]
local projectKey = KEYS[2]
local listData = redis.call('GET', listKey)
local list = {}
if listData then
  list = cjson.decode(listData)
end
local meta = cjson.decode(ARGV[1])
local found = false
for i, item in ipairs(list) do
  if item.id == meta.id then
    list[i] = meta
    found = true
    break
  end
end
if not found then
  table.insert(list, 1, meta)
end
redis.call('SET', listKey, cjson.encode(list))
redis.call('SET', projectKey, ARGV[2])
return 1
`;

async function saveProject(project: Project, userId: string): Promise<void> {
  const r = getRedis();
  if (!r) throw new Error('Redis not available');

  const meta: ProjectMeta = {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    mode: project.mode,
  };

  // Atomic: upsert project meta in list + save project data in one Lua call
  await r.eval(
    SAVE_PROJECT_LUA,
    2,
    LIST_KEY(userId),
    projectKey(project.id),
    JSON.stringify(meta),
    JSON.stringify(project),
  );
}

/** Get the Redis client (for checkpointer use) */
export function getRedisClient(): Redis | null {
  return getRedis();
}
