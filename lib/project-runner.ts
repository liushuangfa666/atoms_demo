import { spawn, ChildProcess } from 'child_process';
import { mkdir, writeFile, rm, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { ProjectFile } from './types';

export interface ProjectStatus {
  projectId: string;
  status: 'idle' | 'installing' | 'running' | 'stopped' | 'error';
  port: number | null;
  backendPort: number | null;
  logs: string[];
  error: string | null;
  startedAt: number | null;
}

interface ManagedProject {
  process: ChildProcess | null;
  backendProcess: ChildProcess | null;
  port: number;
  backendPort: number;
  workDir: string;
  status: ProjectStatus['status'];
  logs: string[];
  error: string | null;
  startedAt: number | null;
  installTimeout: ReturnType<typeof setTimeout> | null;
}

const PROJECTS_DIR = process.env.PROJECTS_DIR || '/tmp/atoms-projects';
const PORT_MIN = parseInt(process.env.PORT_RANGE_MIN || '3100', 10);
const PORT_MAX = parseInt(process.env.PORT_RANGE_MAX || '3120', 10);
const BACKEND_PORT_OFFSET = 100;
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_PROJECTS || '10', 10);
const INSTALL_TIMEOUT = 120_000; // 2 minutes
const MAX_LOG_LINES = 200;

class ProjectRunner {
  private projects = new Map<string, ManagedProject>();
  private usedPorts = new Set<number>();

  /** Allocate the next available port */
  allocatePort(projectId: string): number {
    // Check if already allocated
    const existing = this.projects.get(projectId);
    if (existing) return existing.port;

    for (let port = PORT_MIN; port <= PORT_MAX; port++) {
      if (!this.usedPorts.has(port)) {
        this.usedPorts.add(port);
        return port;
      }
    }
    throw new Error('No available ports. Maximum concurrent projects reached.');
  }

  /** Write project files to disk */
  async writeProjectFiles(projectId: string, files: ProjectFile[]): Promise<string> {
    let port: number;
    const existing = this.projects.get(projectId);
    if (existing) {
      port = existing.port;
    } else {
      port = this.allocatePort(projectId);
    }

    const workDir = join(PROJECTS_DIR, projectId);

    // Write all files
    for (const file of files) {
      const filePath = join(workDir, file.path);
      const dir = dirname(filePath);
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, file.content, 'utf-8');
    }

    // Initialize project tracking if new
    if (!existing) {
      this.projects.set(projectId, {
        process: null,
        backendProcess: null,
        port,
        backendPort: port + BACKEND_PORT_OFFSET,
        workDir,
        status: 'idle',
        logs: [],
        error: null,
        startedAt: null,
        installTimeout: null,
      });
    }

    return workDir;
  }

  /** Install dependencies and start dev servers */
  async installAndStart(projectId: string): Promise<{ port: number; backendPort: number; status: string }> {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found. Call writeProjectFiles first.`);

    // Enforce concurrent limit
    const runningCount = [...this.projects.values()].filter(p => p.status === 'running').length;
    if (runningCount >= MAX_CONCURRENT) {
      // Stop the least recently used project
      const lru = [...this.projects.entries()]
        .filter(([, p]) => p.status === 'running' && p.startedAt)
        .sort(([, a], [, b]) => (a.startedAt || 0) - (b.startedAt || 0))[0];
      if (lru) {
        await this.stop(lru[0]);
      }
    }

    // Stop existing processes if any
    await this.killProcesses(projectId);

    project.status = 'installing';
    project.error = null;
    this.addLog(projectId, '[Runner] Installing dependencies...');

    try {
      // npm install
      await this.runCommand('npm', ['install'], project.workDir, INSTALL_TIMEOUT);
      this.addLog(projectId, '[Runner] Dependencies installed.');

      // Start backend server
      project.status = 'installing';
      this.addLog(projectId, `[Runner] Starting backend on port ${project.backendPort}...`);

      const backendEnv = { ...process.env, PORT: String(project.backendPort) };
      project.backendProcess = spawn('npm', ['run', 'dev:backend'], {
        cwd: project.workDir,
        env: backendEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });
      this.pipeOutput(projectId, project.backendProcess, 'backend');

      // Start frontend (Vite) server
      this.addLog(projectId, `[Runner] Starting frontend on port ${project.port}...`);
      const frontendEnv = { ...process.env, PORT: String(project.port) };
      project.process = spawn('npm', ['run', 'dev:frontend'], {
        cwd: project.workDir,
        env: frontendEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });
      this.pipeOutput(projectId, project.process, 'frontend');

      project.status = 'running';
      project.startedAt = Date.now();
      this.addLog(projectId, `[Runner] Project running. Frontend: :${project.port}, Backend: :${project.backendPort}`);

      // Handle process exit
      project.process.on('exit', (code) => {
        if (project.status === 'running') {
          project.status = code === 0 ? 'stopped' : 'error';
          if (code !== 0) project.error = `Frontend exited with code ${code}`;
          this.addLog(projectId, `[Runner] Frontend stopped (code ${code}).`);
        }
      });

      project.backendProcess.on('exit', (code) => {
        if (project.status === 'running') {
          this.addLog(projectId, `[Runner] Backend stopped (code ${code}).`);
        }
      });

      return { port: project.port, backendPort: project.backendPort, status: 'running' };
    } catch (err) {
      project.status = 'error';
      project.error = err instanceof Error ? err.message : String(err);
      this.addLog(projectId, `[Runner] Error: ${project.error}`);
      throw err;
    }
  }

  /** Stop a running project */
  async stop(projectId: string): Promise<void> {
    await this.killProcesses(projectId);
    const project = this.projects.get(projectId);
    if (project) {
      project.status = 'stopped';
      this.addLog(projectId, '[Runner] Project stopped.');
    }
  }

  /** Restart a project (optionally with new files) */
  async restart(projectId: string, files?: ProjectFile[]): Promise<{ port: number; status: string }> {
    if (files) {
      await this.writeProjectFiles(projectId, files);
    }
    const result = await this.installAndStart(projectId);
    return { port: result.port, status: result.status };
  }

  /** Stop process and remove files */
  async remove(projectId: string): Promise<void> {
    await this.killProcesses(projectId);
    const project = this.projects.get(projectId);
    if (project) {
      this.usedPorts.delete(project.port);
      try {
        await rm(project.workDir, { recursive: true, force: true });
      } catch { /* ignore */ }
      this.projects.delete(projectId);
    }
  }

  /** Get project status */
  getStatus(projectId: string): ProjectStatus | null {
    const project = this.projects.get(projectId);
    if (!project) return null;
    return {
      projectId,
      status: project.status,
      port: project.port,
      backendPort: project.backendPort,
      logs: [...project.logs],
      error: project.error,
      startedAt: project.startedAt,
    };
  }

  /** Stop all projects */
  async cleanup(): Promise<void> {
    const ids = [...this.projects.keys()];
    await Promise.all(ids.map(id => this.stop(id)));
  }

  // --- Private methods ---

  private async killProcesses(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) return;

    if (project.installTimeout) {
      clearTimeout(project.installTimeout);
      project.installTimeout = null;
    }

    const kill = (proc: ChildProcess | null) => {
      if (proc && !proc.killed) {
        try {
          proc.kill('SIGTERM');
          // Force kill after 5s
          setTimeout(() => {
            if (!proc.killed) proc.kill('SIGKILL');
          }, 5000);
        } catch { /* ignore */ }
      }
    };

    kill(project.process);
    kill(project.backendProcess);
    project.process = null;
    project.backendProcess = null;
  }

  private runCommand(cmd: string, args: string[], cwd: string, timeout: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, { cwd, stdio: 'pipe', detached: false });
      let stderr = '';

      proc.stdout?.on('data', () => {}); // drain
      proc.stderr?.on('data', (data) => { stderr += data.toString(); });

      const timer = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(new Error(`Command timed out: ${cmd} ${args.join(' ')}`));
      }, timeout);

      proc.on('exit', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve(0);
        else reject(new Error(`Command failed (code ${code}): ${stderr.slice(-500)}`));
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  private addLog(projectId: string, message: string): void {
    const project = this.projects.get(projectId);
    if (!project) return;
    const timestamp = new Date().toLocaleTimeString();
    project.logs.push(`[${timestamp}] ${message}`);
    if (project.logs.length > MAX_LOG_LINES) {
      project.logs = project.logs.slice(-MAX_LOG_LINES);
    }
  }

  private pipeOutput(projectId: string, proc: ChildProcess, label: string): void {
    const addLine = (data: Buffer) => {
      const text = data.toString().trim();
      if (text) this.addLog(projectId, `[${label}] ${text}`);
    };
    proc.stdout?.on('data', addLine);
    proc.stderr?.on('data', addLine);
  }
}

// Singleton
let runnerInstance: ProjectRunner | null = null;

export function getProjectRunner(): ProjectRunner {
  if (!runnerInstance) {
    runnerInstance = new ProjectRunner();
    // Cleanup on process exit
    process.on('SIGTERM', () => runnerInstance?.cleanup());
    process.on('SIGINT', () => runnerInstance?.cleanup());
  }
  return runnerInstance;
}
