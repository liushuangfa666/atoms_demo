'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  bootContainer,
  mountFiles,
  writeFilesIndividually,
  runAndWait,
  startLongProcess,
  writeFile as wcWriteFile,
  onOutput,
  onPreviewReady,
  getPreviewForProject,
  softReset,
  isBooted,
  setMountedProject,
  getMountedProjectId,
  isSameProjectStructure,
  getLastInstalledPackageJson,
  setLastInstalledPackageJson,
} from '@/lib/webcontainer';
import { ProjectFile } from '@/lib/types';

export interface UseWebContainerReturn {
  ready: boolean;
  previewUrl: string | null;
  terminalOutput: string;
  isInstalling: boolean;
  error: string | null;
  mountAndRun: (files: ProjectFile[], projectId?: string) => Promise<void>;
  updateFile: (path: string, content: string) => Promise<void>;
  restart: () => Promise<void>;
}

export function useWebContainer(projectId?: string): UseWebContainerReturn {
  const [ready, setReady] = useState(isBooted());
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    projectId ? getPreviewForProject(projectId) : null
  );
  const [terminalOutput, setTerminalOutput] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filesRef = useRef<ProjectFile[]>([]);
  const mountedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // WebContainer requires cross-origin isolation (SharedArrayBuffer)
    // In HTTP environments, skip booting entirely and fall back to legacy mode
    if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
      return;
    }

    // If already booted from a previous mount, just set ready
    if (isBooted()) {
      setReady(true);
    } else {
      const boot = async () => {
        try {
          await bootContainer();
          if (!cancelled) setReady(true);
        } catch (e) {
          if (!cancelled) setError(`WebContainer 启动失败: ${e instanceof Error ? e.message : String(e)}`);
        }
      };
      boot();
    }

    const unsubOutput = onOutput((data) => {
      setTerminalOutput(prev => prev + data);
    });

    const unsubPreview = onPreviewReady((url) => {
      setPreviewUrl(url);
    });

    return () => {
      cancelled = true;
      unsubOutput();
      unsubPreview();
    };
  }, []);

  const mountAndRun = useCallback(async (files: ProjectFile[], projectId?: string) => {
    if (!isBooted()) {
      setError('WebContainer 未就绪');
      return;
    }

    filesRef.current = files;
    setError(null);

    const sameProject = projectId && projectId === getMountedProjectId();
    const pkgFile = files.find(f => f.path === 'package.json');
    const currentPkgJson = pkgFile?.content || null;

    // Can skip npm install if same project OR same package.json as previously installed
    const canSkipInstall = sameProject
      || (currentPkgJson && currentPkgJson === getLastInstalledPackageJson());

    if (canSkipInstall) {
      const isDifferentProject = projectId !== getMountedProjectId();

      // Clear old preview when switching to a different project
      if (isDifferentProject) {
        setPreviewUrl(null);
        setIsInstalling(true);
      }

      try {
        await writeFilesIndividually(files);
        if (projectId) setMountedProject(projectId, files);

        if (isDifferentProject) {
          setTerminalOutput(prev => prev + '\x1b[36m[WebContainer]\x1b[0m 文件已更新，重启开发服务器...\n');
          await startLongProcess('npm', ['run', 'dev']);
        } else {
          setTerminalOutput(prev => prev + '\x1b[36m[WebContainer]\x1b[0m 文件已更新（HMR）\n');
        }
      } catch (e) {
        setError(`运行失败: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        if (isDifferentProject) setIsInstalling(false);
      }
      return;
    }

    // Full path: new project or first mount
    setPreviewUrl(null);
    setIsInstalling(true);

    try {
      await mountFiles(files);

      setTerminalOutput(prev => prev + '\x1b[36m[WebContainer]\x1b[0m 安装依赖中...\n');
      const exitCode = await runAndWait('npm', ['install']);
      if (exitCode !== 0) {
        throw new Error(`npm install 失败 (exit code ${exitCode})`);
      }
      setTerminalOutput(prev => prev + '\x1b[32m[WebContainer]\x1b[0m 依赖安装完成\n');

      setIsInstalling(false);
      mountedRef.current = true;

      if (projectId) setMountedProject(projectId, files);
      if (currentPkgJson) setLastInstalledPackageJson(currentPkgJson);

      setTerminalOutput(prev => prev + '\x1b[36m[WebContainer]\x1b[0m 启动开发服务器...\n');
      await startLongProcess('npm', ['run', 'dev']);
    } catch (e) {
      setIsInstalling(false);
      setError(`运行失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  const updateFile = useCallback(async (path: string, content: string) => {
    if (!isBooted() || !mountedRef.current) return;
    try {
      await wcWriteFile(path, content);
    } catch (e) {
      setError(`文件更新失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  const restart = useCallback(async () => {
    if (filesRef.current.length > 0) {
      await mountAndRun(filesRef.current);
    }
  }, [mountAndRun]);

  // Do NOT teardown on unmount — WebContainer is a singleton for the page lifecycle.
  // Calling teardown() makes boot() unusable forever.

  return {
    ready,
    previewUrl,
    terminalOutput,
    isInstalling,
    error,
    mountAndRun,
    updateFile,
    restart,
  };
}
