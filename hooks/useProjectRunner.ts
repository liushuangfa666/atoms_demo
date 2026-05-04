'use client';

import { useState, useCallback, useRef } from 'react';
import { ProjectFile } from '@/lib/types';

export interface UseProjectRunnerReturn {
  status: 'idle' | 'installing' | 'running' | 'stopped' | 'error';
  port: number | null;
  previewUrl: string | null;
  logs: string;
  error: string | null;
  start: (files: ProjectFile[]) => Promise<void>;
  restart: (files?: ProjectFile[]) => Promise<void>;
  stop: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || '';

export function useProjectRunner(projectId: string): UseProjectRunnerReturn {
  const [status, setStatus] = useState<UseProjectRunnerReturn['status']>('idle');
  const [port, setPort] = useState<number | null>(null);
  const [logs, setLogs] = useState('');
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const previewUrl = port ? `${SERVER_URL}:${port}` : null;

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/runner/status?projectId=${projectId}`);
        const data = await res.json();
        setStatus(data.status || 'idle');
        setPort(data.port || null);
        setLogs((data.logs || []).join('\n'));
        setError(data.error || null);
        if (data.status === 'running' || data.status === 'stopped' || data.status === 'error') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch { /* ignore */ }
    }, 2000);
  }, [projectId]);

  const start = useCallback(async (files: ProjectFile[]) => {
    setStatus('installing');
    setError(null);
    setLogs('[Runner] Starting project...');

    try {
      const res = await fetch('/api/runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', projectId, files }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Start failed');

      setPort(data.port);
      setStatus('running');
      setLogs(prev => prev + `\n[Runner] Running on port ${data.port}`);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [projectId]);

  const restart = useCallback(async (files?: ProjectFile[]) => {
    setStatus('installing');
    setError(null);

    try {
      const res = await fetch('/api/runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart', projectId, files }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restart failed');

      setPort(data.port);
      setStatus('running');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [projectId]);

  const stop = useCallback(async () => {
    try {
      await fetch('/api/runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', projectId }),
      });
      setStatus('stopped');
    } catch { /* ignore */ }
  }, [projectId]);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/runner/status?projectId=${projectId}`);
      const data = await res.json();
      setStatus(data.status || 'idle');
      setPort(data.port || null);
      setLogs((data.logs || []).join('\n'));
      setError(data.error || null);
    } catch { /* ignore */ }
  }, [projectId]);

  return {
    status,
    port,
    previewUrl,
    logs,
    error,
    start,
    restart,
    stop,
    refreshStatus,
  };
}
