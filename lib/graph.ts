import { StateGraph, Annotation, END, START, MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, BaseMessage, AIMessage } from "@langchain/core/messages";
import { SYSTEM_PROMPTS, CODEGEN_TOOLS, PLANNER_TOOLS, QA_TOOLS, validateToolFilePath } from "./agents";
import { ProjectFile, QAResult } from "./types";
import { trimToolCallContent } from './context-manager';
import { buildProjectFiles, parseFileMap, getBaseFiles } from './react-template';
import { buildFullstackProjectFiles, parseFullstackFileMap, getFullstackBaseFiles } from './fullstack-template';

// ── State ──────────────────────────────────────────────

const PipelineState = Annotation.Root({
  messages: Annotation<BaseMessage[]>,
  userInput: Annotation<string>,
  currentCode: Annotation<string>,
  htmlCode: Annotation<string>,
  plan: Annotation<string>,
  route: Annotation<string>,
  reviewResult: Annotation<string>,
  retryCount: Annotation<number>,
  chatResponse: Annotation<string>,
  mode: Annotation<string>,
  files: Annotation<ProjectFile[]>,
  projectType: Annotation<string>,
  qaResults: Annotation<QAResult[]>,
  contextSummary: Annotation<string>,
  apiEndpoints: Annotation<{ method: string; path: string; description: string }[]>,
  // Iterative codegen fields
  generationModules: Annotation<Array<{ name: string; files: string[]; description: string }>>,
  generatedFiles: Annotation<ProjectFile[]>,
  currentModuleIndex: Annotation<number>,
});

// ── LLM helpers ────────────────────────────────────────

function createLLM(maxTokens = 8192, modelName = "MiniMax-M2.7", timeout = 120_000) {
  return new ChatOpenAI({
    modelName,
    temperature: 0.7,
    maxTokens,
    timeout,
    streaming: true,
    configuration: {
      baseURL: "https://api.minimax.chat/v1",
      apiKey: process.env.MINIMAX_API_KEY,
    },
  });
}

const fastLLM = () => createLLM(16384, "MiniMax-M2.7-highspeed");

// ── Tool calling helpers ──────────────────────────────────

const LANG_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  html: 'html', css: 'css', json: 'json', md: 'markdown',
};

interface ToolCall {
  name: string;
  args: Record<string, any>;
}

/** Extract tool calls from AIMessage response */
function extractToolCalls(response: AIMessage): ToolCall[] {
  const calls: ToolCall[] = [];

  // LangChain v1: tool_calls property
  if (response.tool_calls && Array.isArray(response.tool_calls)) {
    for (const tc of response.tool_calls) {
      calls.push({ name: tc.name, args: tc.args as Record<string, any> });
    }
    if (calls.length > 0) return calls;
  }

  // Fallback: OpenAI-style additional_kwargs
  const raw = (response.additional_kwargs as any)?.tool_calls;
  if (Array.isArray(raw)) {
    for (const tc of raw) {
      if (tc.function) {
        try {
          calls.push({
            name: tc.function.name,
            args: typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments,
          });
        } catch { /* skip malformed */ }
      }
    }
  }

  return calls;
}

/** Extract files from write_file tool calls with validation */
function extractFilesFromToolCalls(
  calls: ToolCall[],
  projectType: string,
): ProjectFile[] {
  const files: ProjectFile[] = [];
  for (const tc of calls) {
    if (tc.name !== 'write_file') continue;
    const { path, content } = tc.args;
    if (!path || !content) continue;
    const normalized = validateToolFilePath(path, projectType);
    if (!normalized) continue;
    const ext = normalized.split('.').pop() || '';
    files.push({
      path: normalized,
      content: String(content),
      language: LANG_MAP[ext] || 'text',
    });
  }
  return files;
}

/** Merge tool-call files with base template files */
function mergeWithBaseFiles(
  toolFiles: ProjectFile[],
  projectType: string,
  port?: number,
  backendPort?: number,
): ProjectFile[] {
  if (projectType === 'fullstack') {
    const baseFiles = getFullstackBaseFiles(port || 3100, backendPort || 3200);
    const base = Object.entries(baseFiles).map(([path, content]) => ({
      path, content, language: LANG_MAP[path.split('.').pop() || ''] || 'text',
    }));
    // Tool files override base files
    const toolPaths = new Set(toolFiles.map(f => f.path));
    return [...base.filter(f => !toolPaths.has(f.path)), ...toolFiles];
  }

  // React-vite: use buildProjectFiles which adds base files
  const appJsx = toolFiles.find(f => f.path === 'src/App.jsx')?.content || '';
  const extraEntries = Object.fromEntries(
    toolFiles.filter(f => f.path !== 'src/App.jsx').map(f => [f.path, f.content]),
  );
  if (appJsx) {
    return buildProjectFiles(appJsx, Object.keys(extraEntries).length > 0 ? extraEntries : undefined);
  }
  // No App.jsx from tool calls — return tool files as-is
  const baseFiles = getBaseFiles();
  const base = Object.entries(baseFiles).map(([path, content]) => ({
    path, content, language: LANG_MAP[path.split('.').pop() || ''] || 'text',
  }));
  const toolPaths = new Set(toolFiles.map(f => f.path));
  return [...base.filter(f => !toolPaths.has(f.path)), ...toolFiles];
}

/** Clean LLM text output (strip think tags, code blocks) */
function cleanLLMOutput(text: string): string {
  return text
    .replace(/<think[\s\S]*?<\/think>/gi, '')
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
}

/** Convert our ToolDef[] to OpenAI tools format for bindTools */
function toOpenAITools(tools: import('./agents').ToolDef[]) {
  return tools.map(t => ({
    type: t.type as 'function',
    function: t.function,
  }));
}

/** Bind tools to LLM and return the bound runnable */
function bindLLMTools(llm: ChatOpenAI, tools: import('./agents').ToolDef[]) {
  return llm.bindTools(toOpenAITools(tools));
}

// Helper: get trimmed plan — plan is always preserved for codegen
function getTrimmedPlan(plan: string): string {
  return trimToolCallContent(plan || '');
}

// Helper: build contextSummary supplement block (empty string if none)
function contextSummaryBlock(contextSummary?: string): string {
  if (!contextSummary) return '';
  return `\n\n--- 历史上下文摘要 ---\n${contextSummary}`;
}

// ── Node 1: Router ─────────────────────────────────────

async function routerNode(state: typeof PipelineState.State) {
  const llm = createLLM(64);
  const historySummary = state.currentCode
    ? "（当前项目已有代码）"
    : "（当前项目还没有代码）";

  const response = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPTS.router),
    new HumanMessage(`用户消息: ${state.userInput}\n\n上下文: ${historySummary}\n\n对话历史条数: ${state.messages.length}`),
  ]);

  let route = (response.content as string).trim().toLowerCase();

  // Fallback logic
  if (!["new_request", "modify", "question"].includes(route)) {
    route = state.currentCode ? "modify" : "new_request";
  }
  if (route === "modify" && !state.currentCode) {
    route = "new_request";
  }

  // Determine project type with keyword check + LLM fallback
  let projectType = 'simple';
  const backendKeywords = /后端|backend|api|数据库|服务端|server|认证|登录注册|增删改查|crud|flask|fastapi|django|python.*后端|完整.*功能/i;
  if (backendKeywords.test(state.userInput)) {
    projectType = 'fullstack';
  } else if (route !== 'question') {
    // Use LLM for ambiguous cases
    const typeResponse = await llm.invoke([
      new SystemMessage(SYSTEM_PROMPTS.projectType),
      new HumanMessage(`用户消息: ${state.userInput}`),
    ]);
    const typeText = (typeResponse.content as string).trim().toLowerCase();
    if (typeText.includes('fullstack')) projectType = 'fullstack';
  }

  return { route, projectType };
}

// ── Node 2: Planner ────────────────────────────────────

async function plannerNode(state: typeof PipelineState.State) {
  const llm = createLLM(4096);
  const isFullstack = state.projectType === 'fullstack';
  const prompt = isFullstack ? SYSTEM_PROMPTS.plannerFullstack : SYSTEM_PROMPTS.planner;

  // Try tool calling first
  const llmWithTools = bindLLMTools(llm, PLANNER_TOOLS);
  const response = await llmWithTools.invoke([
    new SystemMessage(prompt),
    new HumanMessage(`用户需求: ${state.userInput}\n\n请分析需求，使用工具输出规划。`),
  ]) as AIMessage;

  const toolCalls = extractToolCalls(response);

  // Check for ask_clarification tool call
  const askCall = toolCalls.find(tc => tc.name === 'ask_clarification');
  if (askCall?.args?.question) {
    return { plan: "", chatResponse: askCall.args.question, route: "need_input" };
  }

  // Check for create_plan tool call
  const planCall = toolCalls.find(tc => tc.name === 'create_plan');
  if (planCall?.args) {
    return {
      plan: planCall.args.plan || '',
      chatResponse: "",
      apiEndpoints: planCall.args.apiEndpoints || [],
      generationModules: planCall.args.modules || [],
      generatedFiles: [],
      currentModuleIndex: 0,
    };
  }

  // Fallback: parse text output
  let text = (response.content as string).trim();
  text = text.replace(/<think[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(text);
    if (parsed.need_clarification) {
      return { plan: "", chatResponse: parsed.question, route: "need_input" };
    }
    return {
      plan: parsed.plan,
      chatResponse: "",
      apiEndpoints: parsed.apiEndpoints || [],
      generationModules: parsed.modules || [],
      generatedFiles: [],
      currentModuleIndex: 0,
    };
  } catch {
    return { plan: text, chatResponse: "" };
  }
}

// ── Node 3: Code struct (React project) ────────────────────

async function codeStructNode(state: typeof PipelineState.State) {
  const llm = createLLM(150000, "MiniMax-M2.7-highspeed", 300_000);

  // Include QA feedback on retry so codegen can fix issues
  let qaFeedback = '';
  if (state.retryCount > 0 && state.qaResults && state.qaResults.length > 0) {
    const errorItems = state.qaResults.filter(r => r.severity === 'error');
    if (errorItems.length > 0) {
      qaFeedback = `\n\n⚠️ QA 审查发现以下问题，请务必修复：\n${errorItems.map(r => `- [${r.category}] ${r.message}${r.suggestion ? `（建议：${r.suggestion}）` : ''}`).join('\n')}`;
    }
  }

  // Try tool calling first
  const llmWithTools = bindLLMTools(llm, CODEGEN_TOOLS);
  const response = await llmWithTools.invoke([
    new SystemMessage(SYSTEM_PROMPTS.codeStruct),
    new HumanMessage(`产品规划:\n${getTrimmedPlan(state.plan)}${contextSummaryBlock(state.contextSummary)}\n\n用户需求: ${state.userInput}${qaFeedback}`),
  ]) as AIMessage;

  // Extract tool calls
  const toolCalls = extractToolCalls(response);
  if (toolCalls.length > 0) {
    const toolFiles = extractFilesFromToolCalls(toolCalls, 'react-vite');
    if (toolFiles.length > 0) {
      const files = mergeWithBaseFiles(toolFiles, 'react-vite');
      return { files, projectType: 'react-vite' };
    }
  }

  // Fallback: parse text output
  let text = cleanLLMOutput((response.content as string).trim());
  const filesMap = parseFileMap(text);
  const files = buildProjectFiles(
    filesMap['src/App.jsx'] || '',
    filesMap['src/App.jsx'] ? Object.fromEntries(Object.entries(filesMap).filter(([k]) => k !== 'src/App.jsx')) : undefined,
  );

  return { files, projectType: 'react-vite' };
}

// ── Node 4: Multi-file codegen (React multi-component) ────

async function multiFileCodegenNode(state: typeof PipelineState.State) {
  const llm = createLLM(150000, "MiniMax-M2.7-highspeed", 300_000);
  const isFullstack = state.projectType === 'fullstack';
  const projectType = isFullstack ? 'fullstack' : 'react-vite';

  let qaFeedback = '';
  if (state.retryCount > 0 && state.qaResults && state.qaResults.length > 0) {
    const errorItems = state.qaResults.filter(r => r.severity === 'error');
    if (errorItems.length > 0) {
      qaFeedback = `\n\n⚠️ QA 审查发现以下问题，请务必修复：\n${errorItems.map(r => `- [${r.category}] ${r.message}${r.suggestion ? `（建议：${r.suggestion}）` : ''}`).join('\n')}`;
    }
  }

  const apiContext = state.apiEndpoints?.length
    ? `\n\nAPI 接口定义:\n${state.apiEndpoints.map(e => `${e.method} ${e.path} — ${e.description}`).join('\n')}`
    : '';

  const prompt = isFullstack ? SYSTEM_PROMPTS.multiFileCodegenFullstack : SYSTEM_PROMPTS.multiFileCodegen;

  // Try tool calling first
  const llmWithTools = bindLLMTools(llm, CODEGEN_TOOLS);
  const response = await llmWithTools.invoke([
    new SystemMessage(prompt),
    new HumanMessage(`产品规划:\n${getTrimmedPlan(state.plan)}${contextSummaryBlock(state.contextSummary)}\n\n用户需求: ${state.userInput}${apiContext}${qaFeedback}`),
  ]) as AIMessage;

  const toolCalls = extractToolCalls(response);
  if (toolCalls.length > 0) {
    const toolFiles = extractFilesFromToolCalls(toolCalls, projectType);
    if (toolFiles.length > 0) {
      const files = mergeWithBaseFiles(toolFiles, projectType, 3100, 3200);
      return { files, projectType };
    }
  }

  // Fallback: parse text output
  let text = cleanLLMOutput((response.content as string).trim());

  if (isFullstack) {
    const filesMap = parseFullstackFileMap(text);
    const files = buildFullstackProjectFiles(filesMap, 3100, 3200);
    return { files, projectType: 'fullstack' };
  }

  const filesMap = parseFileMap(text);
  if (Object.keys(filesMap).length === 0) {
    const files = buildProjectFiles(text);
    return { files, projectType: 'react-vite' };
  }

  const baseFiles = getBaseFiles();
  const allFiles: Record<string, string> = { ...baseFiles, ...filesMap };
  const files: ProjectFile[] = Object.entries(allFiles).map(([path, content]) => ({
    path, content: String(content),
    language: LANG_MAP[path.split('.').pop() || ''] || 'text',
  }));
  return { files, projectType: 'react-vite' };
}

// ── Helper: extract export names from code for context summaries ──

function extractExports(code: string): string {
  if (!code) return '(none)';
  const matches = code.match(/export\s+(?:default\s+)?(?:function|const|class|var|let)\s+(\w+)/g);
  if (!matches) return '(auto)';
  return matches.map(m => { const n = m.match(/(\w+)$/); return n ? n[1] : ''; }).filter(Boolean).join(', ');
}

// ── Node: Batch Codegen (iterative multi-file generation) ────


async function batchCodegenNode(state: typeof PipelineState.State) {
  const modules = state.generationModules || [];
  const isRetry = (state.retryCount || 0) > 0 && (state.generatedFiles || []).length > 0;
  // Reset index on retry so full generation runs again
  const currentIndex = isRetry ? 0 : (state.currentModuleIndex || 0);
  const alreadyGenerated = isRetry ? [] : (state.generatedFiles || []);

  // Fallback to single-shot if no modules
  if (modules.length === 0) {
    return multiFileCodegenNode(state);
  }

  // Determine batch: 2 modules per batch (~8000 tokens per call)
  const BATCH_SIZE = 2;
  const batchEnd = Math.min(currentIndex + BATCH_SIZE, modules.length);
  const batchModules = modules.slice(currentIndex, batchEnd);

  // Build context of already-generated files (signatures only)
  const generatedSummary = alreadyGenerated.length > 0
    ? `\n\n已生成的文件（供你参考以确保 import 路径正确）：\n${
        alreadyGenerated.map(f => `- ${f.path} (${f.content.length} chars, exports: ${extractExports(f.content)})`).join('\n')
      }`
    : '';

  const upcomingSummary = batchEnd < modules.length
    ? `\n\n后续还需要生成以下模块（本次不需要生成）：\n${
        modules.slice(batchEnd).map(m => `- ${m.name}: ${m.files.join(', ')}`).join('\n')
      }`
    : '';

  const qaFeedback = state.retryCount > 0 && state.qaResults?.length > 0
    ? '\n\n⚠️ QA 审查发现以下问题，请务必修复：\n' +
      state.qaResults.filter(r => r.severity === 'error')
        .map(r => `- [${r.category}] ${r.message}${r.suggestion ? `（建议：${r.suggestion}）` : ''}`).join('\n')
    : '';

  const isFullstack = state.projectType === 'fullstack';
  const prompt = isFullstack ? SYSTEM_PROMPTS.multiFileCodegenFullstack : SYSTEM_PROMPTS.multiFileCodegen;
  const batchPrompt = `${prompt}

重要：本次你只需要生成以下文件（共 ${batchModules.flatMap(m => m.files).length} 个）：
${batchModules.map(m => `模块「${m.name}」(${m.description}): ${m.files.join(', ')}`).join('\n')}

只输出这些文件的 JSON 对象，不要生成其他文件。`;

  const llm = createLLM(8192, "MiniMax-M2.7-highspeed", 120_000);

  const response = await llm.invoke([
    new SystemMessage(batchPrompt),
    new HumanMessage(
      `产品规划:\n${getTrimmedPlan(state.plan)}${contextSummaryBlock(state.contextSummary)}\n\n用户需求: ${state.userInput}${generatedSummary}${upcomingSummary}${qaFeedback}`
    ),
  ]);

  let text = (response.content as string).trim();
  text = text.replace(/<think[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

  const parseFn = isFullstack ? parseFullstackFileMap : parseFileMap;
  const newFilesMap = parseFn(text);

  const newFiles: ProjectFile[] = Object.entries(newFilesMap).map(([path, content]) => ({
    path,
    content: String(content),
    language: LANG_MAP[path.split('.').pop() || ''] || 'text',
  }));

  // Merge with already-generated files
  const allGenerated = [...alreadyGenerated];
  for (const nf of newFiles) {
    const existingIdx = allGenerated.findIndex(f => f.path === nf.path);
    if (existingIdx >= 0) {
      allGenerated[existingIdx] = nf;
    } else {
      allGenerated.push(nf);
    }
  }

  const isLastBatch = batchEnd >= modules.length;

  // If last batch, merge with base files
  if (isLastBatch) {
    if (isFullstack) {
      const baseFiles = getFullstackBaseFiles(3100, 3200);
      for (const [path, content] of Object.entries(baseFiles)) {
        if (!allGenerated.some(f => f.path === path)) {
          allGenerated.push({ path, content, language: LANG_MAP[path.split('.').pop() || ''] || 'text' });
        }
      }
      return { files: allGenerated, projectType: 'fullstack' as const, generatedFiles: allGenerated, currentModuleIndex: batchEnd };
    }

    const baseFiles = getBaseFiles();
    for (const [path, content] of Object.entries(baseFiles)) {
      if (!allGenerated.some(f => f.path === path)) {
        allGenerated.push({ path, content, language: LANG_MAP[path.split('.').pop() || ''] || 'text' });
      }
    }
    return { files: allGenerated, projectType: 'react-vite' as const, generatedFiles: allGenerated, currentModuleIndex: batchEnd };
  }

  // More batches to go — return partial state
  return {
    generatedFiles: allGenerated,
    currentModuleIndex: batchEnd,
  };
}

// ── Code cleanup (kept for legacy compatibility) ────────

function cleanCodeOutput(text: string): string {
  let clean = text.replace(/<think[\s\S]*?<\/think>/gi, '');
  clean = clean.replace(/```html\n?/gi, '').replace(/```\n?/g, '');
  return clean.trim();
}

// ── Node 5: Merge ──────────────────────────────────────

function mergeNode(state: typeof PipelineState.State) {
  // For React projects, files are already in the correct format
  if (state.files && state.files.length > 0) {
    return { files: state.files, projectType: state.projectType || 'react-vite' };
  }

  // Fallback: wrap any leftover htmlCode in a React project
  if (state.htmlCode) {
    const files = buildProjectFiles(
      `<div dangerouslySetInnerHTML={{ __html: \`${state.htmlCode.replace(/`/g, '\\`')}\` }} />`,
    );
    return { files, projectType: 'react-vite' };
  }

  return { files: [], projectType: 'react-vite' };
}

// ── Node 6: QA Reviewer ────────────────────────────────

async function qaReviewerNode(state: typeof PipelineState.State) {
  const files = state.files || [];
  const results: QAResult[] = [];

  if (files.length === 0) {
    return {
      qaResults: [{ severity: 'error', category: 'functionality', message: '没有生成代码' }],
      reviewResult: 'fail:没有生成代码',
    };
  }

  // Check for required React files
  const hasAppJsx = files.some(f => f.path === 'src/App.jsx' || f.path === 'src/App.tsx');
  if (!hasAppJsx) {
    results.push({ severity: 'error', category: 'functionality', message: '缺少 src/App.jsx 主组件文件', suggestion: '生成 App.jsx 文件' });
  }

  const hasPackageJson = files.some(f => f.path === 'package.json');
  if (!hasPackageJson) {
    results.push({ severity: 'warning', category: 'style', message: '缺少 package.json', suggestion: '系统会自动补充' });
  }

  // Security checks
  const allCode = files.map(f => f.content).join('\n');
  if (allCode.includes('dangerouslySetInnerHTML') && allCode.includes('window.location')) {
    results.push({ severity: 'warning', category: 'security', message: '检测到 dangerouslySetInnerHTML 使用', suggestion: '确保内容是可信的，不包含用户输入' });
  }

  // Content check — App.jsx should have meaningful code
  const appFile = files.find(f => f.path === 'src/App.jsx');
  if (appFile && appFile.content.length < 100) {
    results.push({ severity: 'error', category: 'functionality', message: 'App.jsx 内容过少，可能生成不完整', file: 'src/App.jsx' });
  }

  // Tier 2: LLM-powered review (only if we have a plan)
  if (state.plan && appFile && appFile.content.length > 50) {
    try {
      const llm = createLLM(2048);
      const codeSnippet = appFile.content.length > 3000
        ? appFile.content.substring(0, 3000) + '\n... (truncated)'
        : appFile.content;

      // Try tool calling first
      const llmWithTools = bindLLMTools(llm, QA_TOOLS);
      const response = await llmWithTools.invoke([
        new SystemMessage(SYSTEM_PROMPTS.qaReviewer),
        new HumanMessage(`产品规划:\n${getTrimmedPlan(state.plan)}${contextSummaryBlock(state.contextSummary)}\n\n生成的 React 代码:\n${codeSnippet}\n\n请检查代码是否实现了规划中的功能。使用 report_issue 报告每个问题，或用 approve_code 表示通过。`),
      ]) as AIMessage;

      const toolCalls = extractToolCalls(response);

      if (toolCalls.length > 0) {
        const approveCall = toolCalls.find(tc => tc.name === 'approve_code');
        const issueCalls = toolCalls.filter(tc => tc.name === 'report_issue');

        // If only approve_code was called (no issues), QA passed
        if (approveCall && issueCalls.length === 0) {
          // No LLM issues — static results only
        } else {
          // Extract reported issues
          for (const ic of issueCalls) {
            results.push({
              severity: ic.args.severity || 'info',
              category: ic.args.category || 'functionality',
              message: ic.args.message || '',
              file: ic.args.file,
              suggestion: ic.args.suggestion,
            });
          }
        }
      } else {
        // Fallback: parse text output
        let qaText = cleanLLMOutput((response.content as string).trim());
        const jsonMatch = qaText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.results && Array.isArray(parsed.results)) {
            for (const r of parsed.results) {
              results.push({
                severity: r.severity || 'info',
                category: r.category || 'functionality',
                message: r.message || '',
                file: r.file,
                suggestion: r.suggestion,
              });
            }
          }
        }
      }
    } catch {
      // LLM review failed, static results still valid
    }
  }

  const hasErrors = results.some(r => r.severity === 'error');
  return {
    qaResults: results,
    reviewResult: hasErrors ? `fail:${results.filter(r => r.severity === 'error').map(r => r.message).join('; ')}` : 'pass',
    retryCount: (state.retryCount || 0) + 1,
  };
}

// ── Node 7: Modifier ───────────────────────────────────

async function modifierNode(state: typeof PipelineState.State) {
  const llm = createLLM(150000, "MiniMax-M2.7-highspeed", 300_000);
  const contextAddition = state.contextSummary ? `\n\n上下文摘要: ${state.contextSummary}` : '';
  const isFullstack = state.projectType === 'fullstack';
  const projectType = isFullstack ? 'fullstack' : 'react-vite';

  // Build current file context
  const currentFiles = state.files || [];
  const filesJson = currentFiles.length > 0
    ? JSON.stringify(Object.fromEntries(currentFiles.map(f => [f.path, f.content])), null, 2)
    : '{}';

  const prompt = isFullstack ? SYSTEM_PROMPTS.modifierFullstack : SYSTEM_PROMPTS.modifier;

  // Try tool calling first
  const llmWithTools = bindLLMTools(llm, CODEGEN_TOOLS);
  const response = await llmWithTools.invoke([
    new SystemMessage(prompt),
    new HumanMessage(
      `当前项目文件:\n\`\`\`json\n${filesJson}\n\`\`\`\n\n修改指令: ${state.userInput}${contextAddition}\n\n请使用 write_file 工具输出修改后的文件，只输出变更的文件。`
    ),
  ]) as AIMessage;

  const toolCalls = extractToolCalls(response);
  if (toolCalls.length > 0) {
    const toolFiles = extractFilesFromToolCalls(toolCalls, projectType);
    if (toolFiles.length > 0) {
      const updatedFiles = [...currentFiles];
      for (const tf of toolFiles) {
        const idx = updatedFiles.findIndex(f => f.path === tf.path);
        if (idx >= 0) updatedFiles[idx] = tf;
        else updatedFiles.push(tf);
      }
      return { files: updatedFiles, projectType: state.projectType || 'react-vite' };
    }
  }

  // Fallback: parse text output
  let text = cleanLLMOutput((response.content as string).trim());
  const parseFn = isFullstack ? parseFullstackFileMap : parseFileMap;
  const changedFilesMap = parseFn(text);

  // Merge changed files with existing files
  const updatedFiles = currentFiles.map(f => {
    if (changedFilesMap[f.path] !== undefined) {
      return { ...f, content: changedFilesMap[f.path] };
    }
    return f;
  });

  // Add any new files
  for (const [path, content] of Object.entries(changedFilesMap)) {
    if (!updatedFiles.some(f => f.path === path)) {
      updatedFiles.push({ path, content, language: LANG_MAP[path.split('.').pop() || ''] || 'text' });
    }
  }

  return { files: updatedFiles, projectType: state.projectType || 'react-vite' };
}

// ── Node 8: ChatAgent ──────────────────────────────────

async function chatAgentNode(state: typeof PipelineState.State) {
  const llm = createLLM(2048);
  const response = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPTS.chatAgent),
    new HumanMessage(state.userInput),
  ]);
  return { chatResponse: response.content as string };
}

// ── Node 9: Single agent code generator (engineer mode) ─

async function singleCodeNode(state: typeof PipelineState.State) {
  const llm = createLLM(150000, "MiniMax-M2.7-highspeed", 300_000);
  const contextAddition = state.contextSummary ? `\n\n上下文摘要: ${state.contextSummary}` : '';
  const currentFiles = state.files || [];

  // Detect fullstack intent from user input or existing project type
  const backendKeywords = /后端|backend|api|数据库|服务端|server|认证|登录注册|增删改查|crud|flask|fastapi|django|python.*后端|完整.*功能/i;
  const isFullstackIntent = backendKeywords.test(state.userInput);
  const isExistingFullstack = state.projectType === 'fullstack';
  const isFullstack = isFullstackIntent || isExistingFullstack;
  const projectType = isFullstack ? 'fullstack' : 'react-vite';

  // Mode upgrade: engineer → team — run planner + QA on existing code
  if (state.userInput === '__MODE_UPGRADE__' && currentFiles.length > 0) {
    return { files: currentFiles, projectType: state.projectType || 'react-vite' };
  }

  // Check if modifying existing project or creating new
  if (currentFiles.length > 0 && state.currentCode) {
    const filesJson = JSON.stringify(
      Object.fromEntries(currentFiles.map(f => [f.path, f.content])),
      null, 2,
    );

    const prompt = isFullstack ? SYSTEM_PROMPTS.modifierFullstack : SYSTEM_PROMPTS.modifier;

    // Try tool calling
    const llmWithTools = bindLLMTools(llm, CODEGEN_TOOLS);
    const response = await llmWithTools.invoke([
      new SystemMessage(prompt),
      new HumanMessage(
        `当前项目文件:\n\`\`\`json\n${filesJson}\n\`\`\`\n\n修改指令: ${state.userInput}${contextAddition}\n\n请使用 write_file 工具输出修改后的文件，只输出变更的文件。`
      ),
    ]) as AIMessage;

    const toolCalls = extractToolCalls(response);
    if (toolCalls.length > 0) {
      const toolFiles = extractFilesFromToolCalls(toolCalls, projectType);
      if (toolFiles.length > 0) {
        // Merge: update existing files, add new ones
        const updatedFiles = [...currentFiles];
        for (const tf of toolFiles) {
          const idx = updatedFiles.findIndex(f => f.path === tf.path);
          if (idx >= 0) updatedFiles[idx] = tf;
          else updatedFiles.push(tf);
        }
        return { files: updatedFiles, projectType };
      }
    }

    // Fallback: text parsing
    let text = cleanLLMOutput((response.content as string).trim());
    const parseFn = isFullstack ? parseFullstackFileMap : parseFileMap;
    const changedFilesMap = parseFn(text);

    const updatedFiles = currentFiles.map(f => {
      if (changedFilesMap[f.path] !== undefined) {
        return { ...f, content: changedFilesMap[f.path] };
      }
      return f;
    });

    for (const [path, content] of Object.entries(changedFilesMap)) {
      if (!updatedFiles.some(f => f.path === path)) {
        updatedFiles.push({ path, content, language: LANG_MAP[path.split('.').pop() || ''] || 'text' });
      }
    }

    return { files: updatedFiles, projectType };
  }

  // New project generation
  const genPrompt = isFullstack ? SYSTEM_PROMPTS.multiFileCodegenFullstack : SYSTEM_PROMPTS.codeStruct;

  const llmWithTools = bindLLMTools(llm, CODEGEN_TOOLS);
  const response = await llmWithTools.invoke([
    new SystemMessage(genPrompt),
    new HumanMessage(`用户需求: ${state.userInput}${contextAddition}`),
  ]) as AIMessage;

  const toolCalls = extractToolCalls(response);
  if (toolCalls.length > 0) {
    const toolFiles = extractFilesFromToolCalls(toolCalls, projectType);
    if (toolFiles.length > 0) {
      const files = mergeWithBaseFiles(toolFiles, projectType, 3100, 3200);
      return { files, projectType };
    }
  }

  // Fallback
  let text = cleanLLMOutput((response.content as string).trim());

  if (isFullstack) {
    const filesMap = parseFullstackFileMap(text);
    const files = buildFullstackProjectFiles(filesMap, 3100, 3200);
    return { files, projectType: 'fullstack' };
  }

  const filesMap = parseFileMap(text);
  const files = buildProjectFiles(
    filesMap['src/App.jsx'] || filesMap[Object.keys(filesMap)[0]] || '',
    filesMap['src/App.jsx'] ? Object.fromEntries(Object.entries(filesMap).filter(([k]) => k !== 'src/App.jsx')) : undefined,
  );

  return { files, projectType: 'react-vite' };
}

// ── Node 10: Mode upgrade (engineer → team) ────────────

async function modeUpgradeNode(state: typeof PipelineState.State) {
  const currentFiles = state.files || [];

  // Step 1: Run planner analysis on existing code
  const llm = createLLM(4096);
  const filesSummary = currentFiles.map(f => `${f.path} (${f.content.length} chars)`).join(', ');

  const planResponse = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPTS.planner),
    new HumanMessage(
      `以下项目已完成初步开发，请作为规划师审查现有代码结构并给出改进建议：\n\n项目文件: ${filesSummary}\n用户原始需求: ${state.contextSummary || state.userInput}\n\n请分析架构是否合理，是否有改进空间，输出 JSON 格式。`
    ),
  ]);

  let planText = (planResponse.content as string).trim();
  planText = planText.replace(/<think[\s\S]*?<\/think>/gi, '').trim();
  planText = planText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

  let plan = planText;
  try {
    const parsed = JSON.parse(planText);
    plan = parsed.plan || planText;
  } catch { /* keep raw text */ }

  // Step 2: Run QA review
  const results: QAResult[] = [];
  const appFile = currentFiles.find(f => f.path === 'src/App.jsx');

  if (appFile) {
    try {
      const qaLlm = createLLM(2048);
      const codeSnippet = appFile.content.length > 3000
        ? appFile.content.substring(0, 3000) + '\n... (truncated)'
        : appFile.content;

      const qaResponse = await qaLlm.invoke([
        new SystemMessage(SYSTEM_PROMPTS.qaReviewer),
        new HumanMessage(`请审查以下 React 代码的质量和最佳实践：\n\n${codeSnippet}\n\n输出 JSON 格式的检查结果。`),
      ]);

      let qaText = (qaResponse.content as string).trim();
      qaText = qaText.replace(/<think[\s\S]*?<\/think>/gi, '').trim();
      qaText = qaText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

      const jsonMatch = qaText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.results && Array.isArray(parsed.results)) {
          for (const r of parsed.results) {
            results.push({
              severity: r.severity || 'info',
              category: r.category || 'functionality',
              message: r.message || '',
              file: r.file,
              suggestion: r.suggestion,
            });
          }
        }
      }
    } catch { /* QA review failed */ }
  }

  const hasErrors = results.some(r => r.severity === 'error');
  return {
    plan,
    qaResults: results,
    reviewResult: hasErrors ? 'fail' : 'pass',
    files: currentFiles,
    projectType: state.projectType || 'react-vite',
  };
}

// ── Build Graph ────────────────────────────────────────

const builder = new StateGraph(PipelineState)
  .addNode("router", routerNode)
  .addNode("planner", plannerNode)
  .addNode("code_struct", codeStructNode)
  .addNode("multi_file_codegen", multiFileCodegenNode)

  .addNode("merge", mergeNode)
  .addNode("qa_reviewer", qaReviewerNode)
  .addNode("modifier", modifierNode)
  .addNode("chat_agent", chatAgentNode)
  .addNode("single_code", singleCodeNode)
  .addNode("mode_upgrade", modeUpgradeNode)

  // Entry point: mode-based routing
  .addConditionalEdges(START, (state) => {
    // Mode upgrade: engineer → team, run planner + QA on existing code
    if (state.userInput === "__MODE_UPGRADE__") return "mode_upgrade";
    if (state.mode === "engineer") return "single_code";
    return "router";
  }, {
    "mode_upgrade": "mode_upgrade",
    "single_code": "single_code",
    "router": "router",
  })

  // Router → 3 paths
  .addConditionalEdges("router", (state) => state.route, {
    "new_request": "planner",
    "modify": "modifier",
    "question": "chat_agent",
  })

  // Planner → code generation or need_input
  .addConditionalEdges("planner", (state) => {
    if (state.route === "need_input") return "end";
    if (state.projectType === "fullstack") return "multi_file_codegen";
    return "code_struct";
  }, {
    "code_struct": "code_struct",
    "multi_file_codegen": "multi_file_codegen",
    "end": END,
  })

  // Code struct → merge → QA
  .addEdge("code_struct", "merge")
  .addEdge("multi_file_codegen", "merge")
  .addEdge("merge", "qa_reviewer")

  // QA reviewer → pass or retry
  .addConditionalEdges("qa_reviewer", (state) => {
    if (state.reviewResult === "pass") return "end";
    // Hard limit: retryCount is incremented by qa_reviewer each time
    const retries = state.retryCount || 0;
    if (retries >= 3) return "end"; // max 3 retries (4 total attempts)
    if (state.route === "modify") return "modifier";
    return "code_struct";
  }, {
    "end": END,
    "modifier": "modifier",
    "code_struct": "code_struct",
  })

  // Modifier → QA
  .addEdge("modifier", "qa_reviewer")

  // Chat agent → end
  .addEdge("chat_agent", END)

  // Single code → end (engineer mode, fast path)
  .addEdge("single_code", END)

  // Mode upgrade → end (outputs planner + QA results as messages)
  .addEdge("mode_upgrade", END);

import { isKVAvailable } from './kv-storage';

function createCheckpointer() {
  if (isKVAvailable()) {
    try {
      const { createKVCheckpointer } = require('./kv-checkpointer');
      return createKVCheckpointer();
    } catch {
      // KV checkpointer failed, fallback to memory
    }
  }
  return new MemorySaver();
}

const checkpointer = createCheckpointer();
export const agentGraph = builder.compile({ checkpointer });
export { PipelineState };
