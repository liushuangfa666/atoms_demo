import { NextRequest } from 'next/server';
import { agentGraph } from '@/lib/graph';
import { QAResult, detectProjectType, ProjectFile } from '@/lib/types';
import { isKVAvailable, updateProject, getUserId } from '@/lib/kv-storage';
import { buildPreviewHtml } from '@/lib/build-preview';
import { HumanMessage } from '@langchain/core/messages';
import { estimateStateTokens, compressContextWithLLM, COMPRESSION_THRESHOLD, estimateTokens } from '@/lib/context-manager';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface ChatRequest {
  message: string;
  threadId: string;
  currentCode?: string;
  history?: { role: string; content: string }[];
  mode?: 'team' | 'engineer';
}

function sseMessage(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const { message, threadId, currentCode, history, mode = 'engineer' }: ChatRequest = await request.json();
  const userId = getUserId(request);

  /** Detect projectType from files and persist to storage */
  async function persistProjectType(projectId: string, files: ProjectFile[]): Promise<string> {
    const detected = detectProjectType(files);
    if (isKVAvailable()) {
      try { await updateProject(projectId, { projectType: detected }, userId); } catch { /* ignore */ }
    }
    return detected;
  }

  /** Build preview HTML and cache it in the background (fire-and-forget) */
  function cachePreview(projectId: string, files: ProjectFile[]) {
    buildPreviewHtml(files).then(html => {
      if (html && isKVAvailable()) {
        return updateProject(projectId, { previewHtml: html }, userId);
      }
    }).catch(() => { /* ignore build failures */ });
  }  if (!message) {
    return new Response(sseMessage({ type: 'error', message: '消息不能为空' }), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  if (!process.env.MINIMAX_API_KEY) {
    return new Response(
      sseMessage({ type: 'error', message: 'API Key 未配置，请在 .env.local 中设置 MINIMAX_API_KEY' }) +
      sseMessage({ type: 'done' }),
      { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } },
    );
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Track client disconnect via AbortSignal
  let clientDisconnected = false;
  const onAbort = () => { clientDisconnected = true; };
  request.signal.addEventListener('abort', onAbort);

  (async () => {
    let sentDone = false;
    try {
      const config = { configurable: { thread_id: threadId || 'default' } };

      // Build enriched message (fallback context from client-side history)
      let enrichedMessage = message;
      if (history && history.length > 0) {
        const contextLines = history.slice(-6).map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`);
        enrichedMessage = `对话历史:\n${contextLines.join('\n')}\n\n当前用户消息: ${message}`;
      }

      // Check for existing checkpoint (multi-turn resume)
      let inputState: Record<string, any> = {};
      let hasCheckpoint = false;
      let stateSnapshot: any = null;

      if (isKVAvailable()) {
        try {
          stateSnapshot = await agentGraph.getState(config);
          if (stateSnapshot.values && Object.keys(stateSnapshot.values).length > 0) {
            hasCheckpoint = true;
            const prev = stateSnapshot.values;
            inputState = {
              userInput: enrichedMessage,
              currentCode: currentCode || prev.currentCode || '',
              mode,
              // Preserve previous context for LLM
              messages: [...(prev.messages || []), new HumanMessage(message)],
              contextSummary: prev.contextSummary || '',
            };
          }
        } catch { /* checkpoint not available, start fresh */ }
      }

      if (!hasCheckpoint) {
        inputState = {
          messages: [],
          userInput: enrichedMessage,
          currentCode: currentCode || '',
          htmlCode: '',
          plan: '',
          route: '',
          reviewResult: '',
          retryCount: 0,
          chatResponse: '',
          mode,
          files: [],
          projectType: 'react-vite',
          qaResults: [],
          contextSummary: '',
        };
      }

      // Context compression: if accumulated context > 20k tokens, compress
      if (hasCheckpoint && !inputState.contextSummary) {
        try {
          const totalTokens = estimateStateTokens(stateSnapshot.values);
          const prev = stateSnapshot.values;
          console.log(`[GraphState] Checkpoint loaded — thread: ${threadId}`);
          console.log(`[GraphState]   messages: ${(prev.messages || []).length} items`);
          console.log(`[GraphState]   files: ${(prev.files || []).length} files, total chars: ${(prev.files || []).reduce((s: number, f: any) => s + (f.content?.length || 0), 0)}`);
          console.log(`[GraphState]   plan length: ${(prev.plan || '').length}`);
          console.log(`[GraphState]   currentCode length: ${(prev.currentCode || '').length}`);
          console.log(`[GraphState]   contextSummary: ${prev.contextSummary ? `${prev.contextSummary.length} chars` : '(none)'}`);
          console.log(`[GraphState]   estimated tokens: ~${totalTokens.toLocaleString()} (threshold: ${COMPRESSION_THRESHOLD.toLocaleString()})`);
          console.log(`[GraphState]   route: ${prev.route}, projectType: ${prev.projectType}, retryCount: ${prev.retryCount}`);

          if (totalTokens > COMPRESSION_THRESHOLD) {
            await writer.write(encoder.encode(sseMessage({
              type: 'progress',
              label: '🗜️ 压缩上下文中...',
            })));

            const compressed = await compressContextWithLLM(stateSnapshot.values);
            inputState.contextSummary = compressed;

            console.log(`[GraphState] ✅ Context compressed: ~${totalTokens.toLocaleString()} → ~${estimateTokens(compressed).toLocaleString()} tokens`);

            await writer.write(encoder.encode(sseMessage({
              type: 'context_compressed',
              summary: `🗜️ 上下文已压缩：~${totalTokens.toLocaleString()} → ~${estimateTokens(compressed).toLocaleString()} tokens`,
              fullContent: compressed,
            })));
          }
        } catch (err) {
          console.error('[GraphState] Compression failed:', err);
        }
      } else if (!hasCheckpoint) {
        console.log(`[GraphState] New conversation — thread: ${threadId}, mode: ${mode}`);
      } else {
        console.log(`[GraphState] Resuming with existing contextSummary (${(inputState.contextSummary || '').length} chars)`);
      }

      // Use multi-mode streaming for token-level output
      const graphStream = await agentGraph.stream(inputState, {
        ...config,
        streamMode: ['updates', 'messages'] as any,
      });

      const progressLabels: Record<string, string> = {
        'router': '🔍 分析意图...',
        'planner': '📋 产品规划中...',
        'code_struct': '💻 生成代码中...',
        'multi_file_codegen': '💻 生成多文件项目...',
        'merge': '🔧 整合代码...',
        'qa_reviewer': '🧪 质量检查中...',
        'modifier': '✏️ 修改代码中...',
        'chat_agent': '💬 思考回答...',
        'single_code': '💻 生成代码中...',
        'mode_upgrade': '🔄 切换到团队模式，运行规划师和QA审查...',
      };

      // Heartbeat to keep connection alive during long LLM calls
      const heartbeat = setInterval(() => {
        try {
          writer.write(encoder.encode(sseMessage({ type: 'heartbeat' })));
        } catch { /* writer closed */ }
      }, 15_000);

      try {
        for await (const chunk of graphStream) {
          // Stop processing if client disconnected
          if (clientDisconnected) break;
          // Multi-mode stream: [mode, data]
          const [streamMode, data] = chunk as [string, any];

          if (streamMode === 'messages') {
            // Token-level streaming
            const [msg, metadata] = data;
            if (msg?.content && typeof msg.content === 'string' && msg.content.length > 0) {
              const node = metadata?.langgraph_node || 'unknown';
              await writer.write(encoder.encode(sseMessage({
                type: 'token',
                content: msg.content,
                agent: node,
              })));
            }
          }

          if (streamMode === 'updates') {
            for (const [nodeName, nodeOutput] of Object.entries(data)) {
              const output = nodeOutput as Record<string, any>;

              // Log node output state changes
              const outKeys = Object.keys(output);
              const stateSummary = outKeys.map(k => {
                const v = output[k];
                if (Array.isArray(v)) return `${k}: [${v.length} items]`;
                if (typeof v === 'string') return `${k}: "${v.substring(0, 80)}${v.length > 80 ? '...' : ''}" (${v.length} chars)`;
                return `${k}: ${JSON.stringify(v)?.substring(0, 100)}`;
              }).join(', ');
              console.log(`[GraphState] Node "${nodeName}" output → { ${stateSummary} }`);

              // Send progress event
              if (progressLabels[nodeName]) {
                await writer.write(encoder.encode(sseMessage({
                  type: 'progress',
                  node: nodeName,
                  label: progressLabels[nodeName],
                })));
              }

              if (nodeName === 'router') {
                await writer.write(encoder.encode(sseMessage({
                  type: 'route',
                  route: output.route,
                  projectType: output.projectType || 'simple',
                })));
              }

              if (nodeName === 'planner') {
                if (output.route === 'need_input') {
                  await writer.write(encoder.encode(sseMessage({
                    type: 'need_input',
                    agent: 'emma',
                    question: output.chatResponse,
                  })));
                } else {
                  const planFirstLine = (output.plan || '').split('\n')[0] || '规划完成';
                  await writer.write(encoder.encode(sseMessage({
                    type: 'agent_done',
                    agent: 'emma',
                    fullText: output.plan,
                    toolCall: true,
                    toolName: 'planner',
                    summary: `📋 ${planFirstLine.substring(0, 50)}${planFirstLine.length > 50 ? '...' : ''}`,
                  })));
                }
              }

              if (nodeName === 'multi_file_codegen') {
                if (output.files && output.files.length > 0) {
                  const detectedType = await persistProjectType(threadId, output.files);
                  cachePreview(threadId, output.files);
                  await writer.write(encoder.encode(sseMessage({
                    type: 'files_generated',
                    files: output.files,
                    projectType: detectedType,
                  })));
                  await writer.write(encoder.encode(sseMessage({
                    type: 'agent_done',
                    agent: 'alex',
                    fullText: `多文件项目生成完成，共 ${output.files.length} 个文件：${output.files.map((f: any) => f.path).join(', ')}`,
                    toolCall: true,
                    toolName: 'multi_file_codegen',
                    summary: `💻 生成了 ${output.files.length} 个文件`,
                  })));
                }
                if (output.htmlCode && (!output.files || output.files.length === 0)) {
                  await writer.write(encoder.encode(sseMessage({
                    type: 'code_generated',
                    code: output.htmlCode,
                  })));
                }
              }

              if (nodeName === 'code_struct') {
                if (output.files && output.files.length > 0) {
                  const detectedType = await persistProjectType(threadId, output.files);
                  cachePreview(threadId, output.files);
                  await writer.write(encoder.encode(sseMessage({
                    type: 'files_generated',
                    files: output.files,
                    projectType: detectedType,
                  })));
                  await writer.write(encoder.encode(sseMessage({
                    type: 'agent_done',
                    agent: 'alex',
                    fullText: `代码生成完成，共 ${output.files.length} 个文件：${output.files.map((f: any) => f.path).join(', ')}`,
                    toolCall: true,
                    toolName: 'code_struct',
                    summary: `💻 生成了 ${output.files.length} 个文件`,
                  })));
                }
              }

              if (nodeName === 'merge') {
                if (output.files && output.files.length > 0) {
                  // Files from code_struct path — already emitted, skip duplicate
                } else if (output.htmlCode) {
                  await writer.write(encoder.encode(sseMessage({
                    type: 'code_generated',
                    code: output.htmlCode,
                  })));
                  await writer.write(encoder.encode(sseMessage({
                    type: 'agent_done',
                    agent: 'alex',
                    fullText: `代码生成完成，共 ${output.htmlCode.length} 字符。`,
                    toolCall: true,
                    toolName: 'code_generation',
                    summary: `💻 代码生成完成（${(output.htmlCode.length / 1024).toFixed(1)}KB）`,
                  })));
                }
              }

              if (nodeName === 'qa_reviewer') {
                const qaResults: QAResult[] = output.qaResults || [];
                const hasErrors = qaResults.some(r => r.severity === 'error');

                await writer.write(encoder.encode(sseMessage({
                  type: 'qa_result',
                  results: qaResults,
                  passed: !hasErrors,
                  summary: output.reviewResult,
                  toolCall: true,
                  toolName: 'qa_reviewer',
                  toolSummary: hasErrors
                    ? `🧪 QA检查: 发现 ${qaResults.filter(r => r.severity === 'error').length} 个错误`
                    : '🧪 QA检查通过',
                })));

                if (hasErrors) {
                  const errorSummary = qaResults
                    .filter(r => r.severity === 'error')
                    .map(r => r.message)
                    .join('; ');
                  await writer.write(encoder.encode(sseMessage({
                    type: 'progress',
                    node: 'qa_fixing',
                    label: `🔧 QA 发现问题，尝试自动修复: ${errorSummary.substring(0, 80)}...`,
                  })));
                }
              }

              if (nodeName === 'modifier') {
                await writer.write(encoder.encode(sseMessage({
                  type: 'agent_done',
                  agent: 'alex',
                  fullText: '✅ 代码已修改，请在右侧预览面板查看效果。',
                })));
                if (output.htmlCode) {
                  await writer.write(encoder.encode(sseMessage({
                    type: 'code_generated',
                    code: output.htmlCode,
                  })));
                }
              }

              if (nodeName === 'single_code') {
                if (output.files && output.files.length > 1) {
                  await writer.write(encoder.encode(sseMessage({
                    type: 'agent_done',
                    agent: 'alex',
                    fullText: currentCode
                      ? `✅ 代码已更新，生成了 ${output.files.length} 个文件。`
                      : `✅ 代码已生成，共 ${output.files.length} 个文件。请在代码面板查看，或点击下载获取完整项目。`,
                  })));
                  const detectedType = await persistProjectType(threadId, output.files);
                  cachePreview(threadId, output.files);
                  await writer.write(encoder.encode(sseMessage({
                    type: 'files_generated',
                    files: output.files,
                    projectType: detectedType,
                  })));
                } else {
                  await writer.write(encoder.encode(sseMessage({
                    type: 'agent_done',
                    agent: 'alex',
                    fullText: currentCode
                      ? '✅ 代码已修改，请在右侧预览面板查看效果。'
                      : '✅ 代码已生成，请在右侧预览面板查看效果。',
                  })));
                }
                if (output.htmlCode) {
                  await writer.write(encoder.encode(sseMessage({
                    type: 'code_generated',
                    code: output.htmlCode,
                  })));
                }
              }

              if (nodeName === 'mode_upgrade') {
                // Send planner analysis
                if (output.plan) {
                  await writer.write(encoder.encode(sseMessage({
                    type: 'agent_done',
                    agent: 'emma',
                    fullText: output.plan,
                    toolCall: true,
                    toolName: 'planner',
                    summary: '📋 团队规划师已审查现有代码',
                  })));
                }
                // Send QA results
                const qaResults: QAResult[] = output.qaResults || [];
                const hasErrors = qaResults.some(r => r.severity === 'error');
                await writer.write(encoder.encode(sseMessage({
                  type: 'qa_result',
                  results: qaResults,
                  passed: !hasErrors,
                  toolCall: true,
                  toolName: 'qa_reviewer',
                  toolSummary: hasErrors
                    ? `🧪 QA审查: 发现 ${qaResults.filter(r => r.severity === 'error').length} 个问题`
                    : '🧪 QA审查通过',
                })));
                // Send files (unchanged, but needed for frontend)
                if (output.files && output.files.length > 0) {
                  const detectedType = await persistProjectType(threadId, output.files);
                  cachePreview(threadId, output.files);
                  await writer.write(encoder.encode(sseMessage({
                    type: 'files_generated',
                    files: output.files,
                    projectType: detectedType,
                  })));
                }
              }

              if (nodeName === 'chat_agent') {
                await writer.write(encoder.encode(sseMessage({
                  type: 'agent_done',
                  agent: 'mike',
                  fullText: output.chatResponse,
                })));
              }
            }
          }
        }

        await writer.write(encoder.encode(sseMessage({ type: 'done' })));
        sentDone = true;
      } finally {
        clearInterval(heartbeat);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Chat API error:', errMsg, error);

      try {
        await writer.write(encoder.encode(sseMessage({
          type: 'error',
          message: errMsg.includes('API key')
            ? 'API Key 无效，请检查配置'
            : errMsg.toLowerCase().includes('timeout') || errMsg.includes('ETIMEDOUT')
              ? 'AI 服务响应超时，请稍后重试'
              : `生成失败: ${errMsg}`,
        })));
      } catch { /* Writer might be closed */ }
    } finally {
      request.signal.removeEventListener('abort', onAbort);
      try {
        if (!sentDone) {
          await writer.write(encoder.encode(sseMessage({ type: 'done' })));
        }
      } catch { /* ignore */ }
      try { await writer.close(); } catch { /* ignore */ }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
