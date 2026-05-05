'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ChatPanel from '@/components/ChatPanel';
import PreviewPanel from '@/components/PreviewPanel';
import AgentInfoModal from '@/components/AgentInfoModal';
import TabBar from '@/components/TabBar';
import FileTree from '@/components/FileTree';
import CodeEditor from '@/components/CodeEditor';
import DownloadButton from '@/components/DownloadButton';
import { getProject, updateProject } from '@/lib/storage';
import { Message, Project, Agent, ProjectFile } from '@/lib/types';
import { useWebContainer } from '@/hooks/useWebContainer';
import { useProjectRunner } from '@/hooks/useProjectRunner';

const TerminalPanel = dynamic(() => import('@/components/TerminalPanel'), { ssr: false });

export default function ProjectEditor() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [code, setCode] = useState('');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [initialPromptSent, setInitialPromptSent] = useState(false);
  const [mode, setMode] = useState<'team' | 'engineer'>('engineer');
  const prevModeRef = useRef<'team' | 'engineer'>('engineer');  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'terminal'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [streamingTokens, setStreamingTokens] = useState('');
  const [streamingAgent, setStreamingAgent] = useState('');
  const modeLoadedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // WebContainer integration
  const wc = useWebContainer(projectId);
  const runner = useProjectRunner(projectId);
  const [reactProjectType, setReactProjectType] = useState(false);
  const isReactProject = project?.projectType === 'react-vite' || reactProjectType;
  const isFullstack = project?.projectType === 'fullstack';
  const [hasCachedPreview, setHasCachedPreview] = useState(false);
  const [buildingPreview, setBuildingPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const saveMessages = useCallback((msgs: Message[], newCode?: string, newFiles?: ProjectFile[]) => {
    const updates: Partial<Project> = { messages: msgs };
    if (newCode !== undefined) updates.currentCode = newCode;
    if (newFiles !== undefined) updates.files = newFiles;
    updateProject(projectId, updates).then(updated => {
      if (updated) setProject(updated);
    });
  }, [projectId]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (abortRef.current) abortRef.current.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveMessages(newMessages);
    setIsGenerating(true);

    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const IDLE_TIMEOUT = 300_000;
    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!abortController.signal.aborted) abortController.abort();
      }, IDLE_TIMEOUT);
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          threadId: projectId,
          currentCode: code,
          mode,
          history: newMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          files: files.map(f => f.path),
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`API 请求失败 (${response.status}): ${errText || '未知错误'}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentCode = code;
      let currentFiles = files;

      resetIdleTimer();

      const termLog = (text: string) => {
        setTerminalOutput(prev => prev + `\x1b[90m[${new Date().toLocaleTimeString()}]\x1b[0m ${text}\n`);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resetIdleTimer();

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'progress') {
              setProgressLabel(data.label || '处理中...');
              if (data.label) termLog(data.label);
            }

            if (data.type === 'token') {
              const node = data.agent || '';
              setStreamingTokens(prev => prev + data.content);
              const nodeAgentMap: Record<string, string> = {
                chat_agent: 'mike', planner: 'emma', code_struct: 'alex',
                multi_file_codegen: 'alex', modifier: 'alex', single_code: 'alex',
                qa_reviewer: 'qa', router: 'mike',
              };
              setStreamingAgent(nodeAgentMap[node] || 'alex');
            }

            if (data.type === 'route') {
              const routeLabels: Record<string, string> = {
                new_request: '🔍 分析为新需求，启动团队...',
                modify: '🔧 检测到修改指令，调整代码...',
                question: '💬 回答你的问题...',
              };
              termLog(`路由 → ${routeLabels[data.route] || data.route}`);
              const statusMsg: Message = {
                id: `route-${Date.now()}`,
                role: 'mike' as const,
                content: routeLabels[data.route] || '处理中...',
                timestamp: new Date().toISOString(),
              };
              newMessages.push(statusMsg);
              setMessages([...newMessages]);
            }

            if (data.type === 'need_input') {
              const askMsg: Message = {
                id: `ask-${Date.now()}`,
                role: (data.agent || 'emma') as Message['role'],
                content: data.question,
                timestamp: new Date().toISOString(),
              };
              newMessages.push(askMsg);
              setMessages([...newMessages]);
            }

            if (data.type === 'agent_done') {
              setStreamingTokens('');
              setStreamingAgent('');
              termLog(`\x1b[32m✓ ${data.agent}\x1b[0m 完成`);
              const isToolCall = data.toolCall === true;
              const agentMsg: Message = {
                id: `agent-${data.agent}-${Date.now()}`,
                role: data.agent as Message['role'],
                content: data.fullText,
                timestamp: new Date().toISOString(),
                type: isToolCall ? 'tool_call' : 'text',
                summary: data.summary,
                toolName: data.toolName,
              };
              newMessages.push(agentMsg);
              setMessages([...newMessages]);
              saveMessages([...newMessages], currentCode, currentFiles);
            }

            if (data.type === 'context_compressed') {
              termLog(`\x1b[35m🗜️ ${data.summary}\x1b[0m`);
              const compressMsg: Message = {
                id: `compress-${Date.now()}`,
                role: 'mike' as const,
                content: data.fullContent,
                timestamp: new Date().toISOString(),
                type: 'compression',
                summary: data.summary,
              };
              newMessages.push(compressMsg);
              setMessages([...newMessages]);
              saveMessages([...newMessages], currentCode, currentFiles);
            }

            if (data.type === 'code_generated') {
              // Legacy single HTML — for backward compat
              currentCode = data.code;
              setCode(data.code);
              if (currentFiles.length <= 1) {
                currentFiles = [{ path: 'index.html', content: data.code, language: 'html' }];
              } else {
                currentFiles = currentFiles.map(f =>
                  f.path === 'index.html' ? { ...f, content: data.code } : f
                );
              }
              setFiles(currentFiles);
              termLog(`\x1b[36m代码生成: ${data.code.length} 字符\x1b[0m`);
              saveMessages([...newMessages], data.code, currentFiles);
            }

            if (data.type === 'files_generated') {
              currentFiles = data.files;
              setFiles(data.files);
              setHasCachedPreview(false); // Switch to live preview
              setBuildingPreview(false);
              if (data.projectType === 'react-vite') {
                setReactProjectType(true);
                updateProject(projectId, { projectType: 'react-vite' });
              }
              if (data.projectType === 'fullstack') {
                updateProject(projectId, { projectType: 'fullstack' });
              }
              termLog(`\x1b[36m文件生成: ${data.files.length} 个文件\x1b[0m`);

              // If React project, mount to WebContainer
              if (data.projectType === 'react-vite' && wc.ready) {
                termLog(`\x1b[36m[WebContainer] 挂载文件并启动...\x1b[0m`);
                wc.mountAndRun(data.files, projectId).catch((e: Error) => {
                  termLog(`\x1b[31m[WebContainer] 错误: ${e.message}\x1b[0m`);
                });
              }

              // If fullstack project, start server-side runner
              if (data.projectType === 'fullstack') {
                termLog(`\x1b[36m[Runner] 启动全栈项目...\x1b[0m`);
                runner.start(data.files).catch((e: unknown) => {
                  termLog(`\x1b[31m[Runner] 错误: ${e instanceof Error ? e.message : String(e)}\x1b[0m`);
                });
              }

              // Rebuild preview for React projects (esbuild bundling)
              if (data.projectType === 'react-vite' || data.files.some((f: ProjectFile) => f.path === 'vite.config.js')) {
                setBuildingPreview(true);
                termLog(`\x1b[36m[Preview] 重新构建预览...\x1b[0m`);
                fetch(`/api/projects/${projectId}/build-preview`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ files: data.files, projectType: data.projectType }),
                }).then(r => r.json()).then(result => {
                  if (result.size && result.html) {
                    setHasCachedPreview(true);
                    setPreviewHtml(result.html);
                    setProject(prev => prev ? { ...prev, previewHtml: result.html } : prev);
                    termLog(`\x1b[32m[Preview] 预览构建完成: ${(result.size / 1024).toFixed(1)}KB\x1b[0m`);
                  } else if (result.size) {
                    setHasCachedPreview(true);
                    getProject(projectId).then(updated => {
                      if (updated) setProject(updated);
                    });
                    termLog(`\x1b[32m[Preview] 预览已缓存\x1b[0m`);
                  } else {
                    termLog(`\x1b[31m[Preview] 构建失败\x1b[0m`);
                  }
                  setBuildingPreview(false);
                }).catch((e: Error) => {
                  termLog(`\x1b[31m[Preview] 构建错误: ${e.message}\x1b[0m`);
                  setBuildingPreview(false);
                });
              }

              // Don't update code with raw index.html for React projects —
              // the preview should use the esbuild-bundled HTML instead.
              // Only set code for non-React (single-HTML) projects.
              const isReact = data.projectType === 'react-vite' || data.files.some((f: ProjectFile) => f.path === 'vite.config.js');
              if (!isReact) {
                const htmlFile = data.files.find((f: ProjectFile) => f.path === 'index.html');
                if (htmlFile) {
                  currentCode = htmlFile.content;
                  setCode(htmlFile.content);
                }
              }
              saveMessages([...newMessages], currentCode, data.files);
            }

            if (data.type === 'runner_started') {
              termLog(`\x1b[32m[Runner] 项目已启动: 端口 ${data.port}\x1b[0m`);
            }

            if (data.type === 'qa_result') {
              termLog(`\x1b[33mQA检查: ${data.passed ? '✓ 通过' : '✗ 有问题'}\x1b[0m`);
              const qaMsg: Message = {
                id: `qa-${Date.now()}`,
                role: 'qa' as Message['role'],
                content: formatQAResults(data.results, data.passed),
                timestamp: new Date().toISOString(),
                type: 'tool_call',
                summary: data.toolSummary || (data.passed ? '🧪 QA检查通过' : '🧪 QA检查发现问题'),
                toolName: 'qa_reviewer',
              };
              newMessages.push(qaMsg);
              setMessages([...newMessages]);
              saveMessages([...newMessages], currentCode, currentFiles);
            }

            if (data.type === 'batch_progress') {
              const { moduleIndex, totalModules, files: batchFiles, summary } = data;
              termLog(`\x1b[36m[Batch] ${summary || `批次 ${moduleIndex}/${totalModules}: ${batchFiles?.length || 0} 个文件`}\x1b[0m`);
              if (batchFiles && batchFiles.length > 0) {
                // Accumulate partial files into currentFiles for progressive display
                currentFiles = [...currentFiles, ...batchFiles];
                setFiles([...currentFiles]);
              }
            }

            if (data.type === 'build_error') {
              const { error, errors, summary } = data;
              termLog(`\x1b[31m[Build Error] ${summary || error}\x1b[0m`);
              if (errors && errors.length > 0) {
                for (const e of errors) {
                  termLog(`\x1b[31m  ${e.file}${e.line ? `:${e.line}` : ''}: ${e.message}\x1b[0m`);
                }
              }
            }

            if (data.type === 'error') {
              const errorMsg: Message = {
                id: `error-${Date.now()}`,
                role: 'mike' as const,
                content: `出错了: ${data.message}`,
                timestamp: new Date().toISOString(),
              };
              newMessages.push(errorMsg);
              setMessages([...newMessages]);
            }
          } catch { /* Skip malformed JSON */ }
        }
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: 'mike' as const,
          content: '响应超时（长时间无新内容），请重试。',
          timestamp: new Date().toISOString(),
        };
        const updated = [...newMessages, errorMsg];
        setMessages(updated);
        saveMessages(updated);
      } else {
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: 'mike' as const,
          content: `请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: new Date().toISOString(),
        };
        const updated = [...newMessages, errorMsg];
        setMessages(updated);
        saveMessages(updated);
      }
    } finally {
      if (idleTimer) clearTimeout(idleTimer);
      if (abortRef.current === abortController) abortRef.current = null;
      setIsGenerating(false);
      setProgressLabel('');
      setStreamingTokens('');
      setStreamingAgent('');
    }
  }, [messages, code, files, mode, saveMessages, wc]);

  // Handle mode switch: engineer → team triggers upgrade
  const handleModeSwitch = useCallback((newMode: 'team' | 'engineer') => {
    const oldMode = mode;
    setMode(newMode);
    updateProject(projectId, { mode: newMode });

    // When switching from engineer to team with existing code, run planner + QA
    if (oldMode === 'engineer' && newMode === 'team' && (files.length > 0 || code)) {
      handleSendMessage('__MODE_UPGRADE__');
    }
  }, [mode, files, code, projectId, handleSendMessage]);

  // Load project
  useEffect(() => {
    let cancelled = false;
    getProject(projectId).then(p => {
      if (cancelled || !p) return;
      setProject(p);
      setMessages(p.messages);
      setCode(p.currentCode);
      setFiles(p.files || []);
      setHasCachedPreview(!!p.previewHtml);
      if (p.previewHtml) setPreviewHtml(p.previewHtml);
      if (!modeLoadedRef.current) {
        setMode(p.mode || 'engineer');
        prevModeRef.current = p.mode || 'engineer';
        modeLoadedRef.current = true;
      }
      setTerminalOutput(`\x1b[36m[Atoms]\x1b[0m 项目「${p.name}」已加载\n\x1b[90m模式: ${p.mode || 'engineer'} | 类型: ${p.projectType || 'unknown'} | 文件: ${(p.files || []).length} 个\x1b[0m\n\n`);

      // Auto-build preview if missing (React projects only)
      if (!p.previewHtml && p.files?.length > 0 && (p.projectType === 'react-vite' || p.files.some(f => f.path === 'vite.config.js'))) {
        setBuildingPreview(true);
        fetch(`/api/projects/${p.id}/build-preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: p.files, projectType: p.projectType }),
        }).then(r => r.json()).then(result => {
          if (!cancelled && result.size) {
            setHasCachedPreview(true);
            if (result.html) {
              setPreviewHtml(result.html);
              setProject(prev => prev ? { ...prev, previewHtml: result.html } : prev);
            } else {
              getProject(projectId).then(updated => {
                if (updated && !cancelled) {
                  setProject(updated);
                  if (updated.previewHtml) setPreviewHtml(updated.previewHtml);
                }
              });
            }
          }
          if (!cancelled) setBuildingPreview(false);
        }).catch(() => { if (!cancelled) setBuildingPreview(false); });
      }
    });
    return () => { cancelled = true; };
  }, [projectId]);

  // Auto-mount files to WebContainer when ready and no cached preview
  useEffect(() => {
    if (hasCachedPreview || buildingPreview) return; // Use cached HTML or wait for build
    if (wc.ready && files.length > 0 && isReactProject) {
      wc.mountAndRun(files, projectId).catch((e: Error) => {
        setTerminalOutput(prev => prev + `\x1b[31m[WebContainer] 自动挂载失败: ${e.message}\x1b[0m\n`);
      });
    }
  }, [wc.ready, projectId, files.length, hasCachedPreview, buildingPreview]);

  // Auto-start runner for fullstack projects
  useEffect(() => {
    if (!isFullstack || files.length === 0) return;
    if (runner.status === 'idle' || runner.status === 'stopped') {
      runner.start(files).catch(() => {});
    } else if (runner.status !== 'installing' && runner.status !== 'running') {
      runner.refreshStatus();
    }
  }, [isFullstack, files.length, runner.status]);

  // Auto-send template prompt
  useEffect(() => {
    if (initialPromptSent || messages.length > 0 || !project) return;
    const prompt = searchParams.get('prompt');
    if (prompt) {
      setInitialPromptSent(true);
      handleSendMessage(prompt);
    }
  }, [project, initialPromptSent, messages.length, searchParams, handleSendMessage]);

  // Combine WebContainer terminal output with local terminal output
  const combinedTerminalOutput = terminalOutput
    + (wc.terminalOutput ? `\x1b[36m[WebContainer]\x1b[0m\n${wc.terminalOutput}` : '')
    + (runner.logs ? `\x1b[36m[Runner]\x1b[0m\n${runner.logs}` : '');

  if (!project) {
    return <div className="flex items-center justify-center h-full text-text-tertiary">项目不存在</div>;
  }

  const selectedFileData = files.find(f => f.path === selectedFile) || null;

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/projects')} className="text-text-secondary hover:text-white text-sm">
            ← 返回
          </button>
          <span className="text-sm font-semibold text-white">{project.name}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleModeSwitch('engineer')}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                mode === 'engineer' ? 'bg-blue-600 text-white' : 'bg-bg-card text-text-tertiary hover:text-white'
              }`}
              title="单Agent模式，速度更快，Token消耗更少"
            >
              工程师
            </button>
            <button
              onClick={() => handleModeSwitch('team')}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                mode === 'team' ? 'bg-amber-600 text-white' : 'bg-bg-card text-text-tertiary hover:text-white'
              }`}
              title="多Agent协作模式，质量更高，Token消耗更多"
            >
              团队
            </button>
            <span className="text-[10px] text-text-tertiary ml-1">
              {isFullstack ? 'Fullstack' : isReactProject ? 'React + Vite' : project.projectType || 'HTML'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFullstack && runner.status === 'running' && <span className="text-[10px] text-green-400">Runner :{runner.port}</span>}
          {isFullstack && runner.status === 'installing' && <span className="text-[10px] text-amber-400">安装中...</span>}
          {isFullstack && runner.error && <span className="text-[10px] text-red-400">{runner.error}</span>}
          {!isFullstack && wc.ready && <span className="text-[10px] text-green-400">WebContainer 就绪</span>}
          {!isFullstack && wc.error && <span className="text-[10px] text-red-400">{wc.error}</span>}
          <DownloadButton project={project} />
          <span className="text-xs text-text-tertiary">
            {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat Panel */}
        <div className="w-1/2 border-r border-border">
          <ChatPanel
            messages={messages}
            isGenerating={isGenerating}
            progressLabel={progressLabel}
            streamingTokens={streamingTokens}
            streamingAgent={streamingAgent}
            onSendMessage={handleSendMessage}
            onAgentClick={agent => setSelectedAgent(agent)}
          />
        </div>

        {/* Right: Tabbed Panel */}
        <div className="w-1/2 flex flex-col">
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="flex-1 overflow-hidden">
            {activeTab === 'preview' && (
              <PreviewPanel
                mode={
                  isFullstack && runner.status === 'running' ? 'server'
                  : isReactProject && hasCachedPreview ? 'legacy'
                  : isReactProject && wc.ready && !buildingPreview ? 'webcontainer'
                  : 'legacy'
                }
                code={hasCachedPreview && previewHtml ? previewHtml : code}
                previewUrl={
                  isFullstack && runner.previewUrl ? runner.previewUrl
                  : wc.previewUrl
                }
                isLoading={
                  // Only show loading spinner during initial generation, not when re-entering
                  // with existing preview content. Re-building preview is fast (esbuild ~100ms).
                  (buildingPreview && !(hasCachedPreview && previewHtml)) ||
                  (isFullstack ? runner.status === 'installing' : wc.isInstalling)
                }
              />
            )}
            {activeTab === 'code' && (
              <div className="flex h-full">
                <div className="w-56 border-r border-border bg-bg-sidebar overflow-y-auto">
                  <FileTree
                    files={files.length > 0 ? files : (code ? [{ path: 'index.html', content: code, language: 'html' }] : [])}
                    selectedFile={selectedFile}
                    onSelectFile={setSelectedFile}
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <CodeEditor file={selectedFileData || (code ? { path: 'index.html', content: code, language: 'html' } : null)} />
                </div>
              </div>
            )}
            {activeTab === 'terminal' && (
              <div className="h-full">
                <TerminalPanel output={combinedTerminalOutput} />
              </div>
            )}
          </div>
        </div>
      </div>

      <AgentInfoModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
}

function formatQAResults(results: any[], passed: boolean): string {
  if (!results || results.length === 0) {
    return passed ? '✅ QA 检查通过，代码质量良好。' : '✅ QA 检查通过。';
  }

  const lines = [passed ? '📊 QA 检查报告（通过，有建议）：' : '📊 QA 检查报告：'];
  for (const r of results) {
    const icon = r.severity === 'error' ? '🔴' : r.severity === 'warning' ? '🟡' : '🔵';
    lines.push(`${icon} [${r.severity}] ${r.message}`);
    if (r.suggestion) lines.push(`   💡 ${r.suggestion}`);
  }
  return lines.join('\n');
}
