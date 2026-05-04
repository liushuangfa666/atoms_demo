'use client';

import { WebContainer } from '@webcontainer/api';
import { ProjectFile } from './types';

type OutputListener = (data: string) => void;
type PreviewListener = (url: string) => void;

let instance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;
let previewUrl: string | null = null;
const outputListeners = new Set<OutputListener>();
const previewListeners = new Set<PreviewListener>();
let devProcess: Awaited<ReturnType<WebContainer['spawn']>> | null = null;
let booted = false;

// Project-aware caching state
let mountedProjectId: string | null = null;
let mountedFilesHash: string | null = null;
let lastInstalledPackageJson: string | null = null;

export function getLastInstalledPackageJson(): string | null {
  return lastInstalledPackageJson;
}

export function setLastInstalledPackageJson(content: string): void {
  lastInstalledPackageJson = content;
}

function toFileSystemTree(files: ProjectFile[]): Record<string, unknown> {
  const tree: Record<string, unknown> = {};
  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let current = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i];
      if (!current[dir]) {
        current[dir] = { directory: {} };
      }
      current = (current[dir] as { directory: Record<string, unknown> }).directory;
    }
    const fileName = parts[parts.length - 1];
    current[fileName] = {
      file: { contents: file.content },
    };
  }
  return tree;
}

function emitOutput(data: string) {
  for (const listener of outputListeners) {
    listener(data);
  }
}

export async function bootContainer(): Promise<WebContainer> {
  // Return existing instance immediately
  if (instance) return instance;

  // If boot is already in progress, wait for it
  if (bootPromise) return bootPromise;

  bootPromise = WebContainer.boot({
    coep: 'require-corp',
    workdirName: 'project',
  }).then((wc) => {
    instance = wc;
    booted = true;

    instance.on('server-ready', (_port, url) => {
      previewUrl = url;
      for (const listener of previewListeners) {
        listener(url);
      }
    });

    return wc;
  }).catch((err) => {
    bootPromise = null;
    throw err;
  });

  return bootPromise;
}

export function isBooted(): boolean {
  return booted;
}

export function setMountedProject(projectId: string, files: ProjectFile[]): void {
  mountedProjectId = projectId;
  mountedFilesHash = files.map(f => `${f.path}:${f.content.length}`).join('|');
}

export function getMountedProjectId(): string | null {
  return mountedProjectId;
}

export function isSameProjectStructure(files: ProjectFile[]): boolean {
  if (!mountedFilesHash) return false;
  const currentHash = files.map(f => `${f.path}:${f.content.length}`).join('|');
  return mountedFilesHash === currentHash;
}

export function getPreviewUrl(): string | null {
  return previewUrl;
}

export function getPreviewForProject(projectId: string): string | null {
  // Only return preview URL if it belongs to the requested project
  if (projectId === mountedProjectId && previewUrl) return previewUrl;
  return null;
}

export function onOutput(callback: OutputListener): () => void {
  outputListeners.add(callback);
  return () => outputListeners.delete(callback);
}

export function onPreviewReady(callback: PreviewListener): () => void {
  previewListeners.add(callback);
  return () => previewListeners.delete(callback);
}

export async function mountFiles(files: ProjectFile[]): Promise<void> {
  const wc = await bootContainer();
  const tree = toFileSystemTree(files);
  await wc.mount(tree as any);
}

/** Write files individually without destroying node_modules */
export async function writeFilesIndividually(files: ProjectFile[]): Promise<void> {
  const wc = await bootContainer();
  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    // Ensure parent directories exist
    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts.slice(0, i + 1).join('/');
      try {
        await wc.fs.mkdir(dir, { recursive: true });
      } catch { /* already exists */ }
    }
    await wc.fs.writeFile(file.path, file.content);
  }
}

export async function runAndWait(command: string, args: string[]): Promise<number> {
  const wc = await bootContainer();
  const process = await wc.spawn(command, args);

  process.output.pipeTo(
    new WritableStream({
      write(data) {
        emitOutput(data);
      },
    }),
  );

  return process.exit;
}

export async function startLongProcess(command: string, args: string[]): Promise<void> {
  const wc = await bootContainer();

  // Kill previous dev process if any
  if (devProcess) {
    devProcess.kill();
    devProcess = null;
  }

  devProcess = await wc.spawn(command, args);

  devProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        emitOutput(data);
      },
    }),
  );
}

export async function writeFile(path: string, content: string): Promise<void> {
  const wc = await bootContainer();
  await wc.fs.writeFile(path, content);
}

export async function readFile(path: string): Promise<string> {
  const wc = await bootContainer();
  return await wc.fs.readFile(path, 'utf-8');
}

export async function exportAsFiles(): Promise<ProjectFile[]> {
  const wc = await bootContainer();
  const files: ProjectFile[] = [];

  async function walk(dir: string) {
    const entries = await wc.fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = dir === '.' ? entry.name : `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const content = await wc.fs.readFile(fullPath, 'utf-8');
        const ext = fullPath.split('.').pop() || '';
        const langMap: Record<string, string> = {
          ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
          html: 'html', css: 'css', json: 'json', md: 'markdown',
        };
        files.push({
          path: fullPath,
          content,
          language: langMap[ext] || 'text',
        });
      }
    }
  }

  await walk('.');
  return files;
}

/**
 * Kill dev process and clean up listeners, but do NOT teardown the WebContainer.
 * The WebContainer singleton survives across component remounts.
 */
export function softReset(): void {
  if (devProcess) {
    devProcess.kill();
    devProcess = null;
  }
  previewUrl = null;
  outputListeners.clear();
  previewListeners.clear();
}

/**
 * Full teardown — only call when the entire app is being destroyed.
 * After this, WebContainer.boot() cannot be called again (browser limitation).
 */
export function teardown(): void {
  softReset();
  if (instance) {
    instance.teardown();
    instance = null;
    booted = false;
    bootPromise = null;
  }
}
