import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/**
 * Rough token estimation: ~3 chars per token for mixed Chinese/English
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3);
}

/**
 * Trim content: keep first 30% + last 30%, cut middle 40%
 */
export function trimToolCallContent(content: string): string {
  if (!content || content.length < 200) return content;
  const len = content.length;
  const headEnd = Math.floor(len * 0.3);
  const tailStart = Math.floor(len * 0.7);
  const head = content.substring(0, headEnd);
  const tail = content.substring(tailStart);
  const cutChars = tailStart - headEnd;
  return `${head}\n\n--- [已省略约 ${cutChars} 字符] ---\n\n${tail}`;
}

/**
 * Calculate total tokens from state fields
 */
export function estimateStateTokens(state: Record<string, any>): number {
  let total = 0;
  const textFields = ['plan', 'reviewResult', 'chatResponse', 'userInput', 'contextSummary', 'currentCode', 'htmlCode'];
  for (const f of textFields) {
    if (state[f]) total += estimateTokens(String(state[f]));
  }
  if (state.messages) {
    for (const m of state.messages) {
      const content = typeof m.content === 'string' ? m.content : '';
      total += estimateTokens(content);
    }
  }
  if (state.files && Array.isArray(state.files)) {
    for (const f of state.files) {
      total += estimateTokens(f.content || '');
      total += estimateTokens(f.path || '');
    }
  }
  return total;
}

function buildContextText(state: Record<string, any>): string {
  const parts: string[] = [];
  if (state.userInput) parts.push(`[用户需求] ${state.userInput}`);
  if (state.contextSummary) parts.push(`[之前的上下文摘要] ${state.contextSummary}`);
  if (state.plan) parts.push(`[产品规划] ${state.plan}`);
  if (state.reviewResult) parts.push(`[QA审查结果] ${state.reviewResult}`);
  if (state.currentCode) parts.push(`[当前代码] ${state.currentCode}`);
  if (state.files && state.files.length > 0) {
    const fileContents = state.files.map((f: any) =>
      `[${f.path}]\n${f.content || ''}`
    );
    parts.push(`[项目文件]\n${fileContents.join('\n\n')}`);
  }
  if (state.messages && state.messages.length > 0) {
    for (const m of state.messages) {
      const role = m._getType ? m._getType() : (m.role || 'unknown');
      const content = typeof m.content === 'string' ? m.content : '';
      parts.push(`[${role}] ${content}`);
    }
  }
  return parts.join('\n\n');
}

/**
 * Compress context using LLM to <5k tokens
 */
export async function compressContextWithLLM(
  state: Record<string, any>,
): Promise<string> {
  const contextText = buildContextText(state);
  const llm = new ChatOpenAI({
    modelName: 'MiniMax-M2.7-highspeed',
    temperature: 0.3,
    maxTokens: 8192,
    timeout: 60_000,
    configuration: {
      baseURL: 'https://api.minimax.chat/v1',
      apiKey: process.env.MINIMAX_API_KEY,
    },
  });

  const response = await llm.invoke([
    new SystemMessage(`你是一个上下文压缩专家。请将以下多轮对话上下文压缩提炼。

要求：
1. 尽可能保留所有结论性信息
2. 保留用户的核心需求和关键决策
3. 保留代码的关键变更和状态
4. 保留QA审查的结论
5. 压缩后控制在5000 tokens以内
6. 使用简洁的要点格式

输出格式：
## 上下文摘要
- 用户需求：...
- 规划结论：...
- 代码状态：...
- QA结论：...
- 关键决策：...`),
    new HumanMessage(`请压缩以下上下文：\n\n${contextText}`),
  ]);

  return (response.content as string).trim();
}

export const COMPRESSION_THRESHOLD = 20000;
