import { NextRequest } from 'next/server';
import { agentGraph } from '@/lib/graph';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ChatRequest {
  message: string;
  history: { role: string; content: string }[];
}

function sseMessage(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const { message }: ChatRequest = await request.json();

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    try {
      // Stream LangGraph execution with "updates" mode
      const graphStream = await agentGraph.stream(
        { userInput: message },
        { streamMode: 'updates' }
      );

      for await (const update of graphStream) {
        // update format: { nodeName: { field: value } }
        for (const [nodeName, nodeOutput] of Object.entries(update)) {
          const output = nodeOutput as Record<string, string>;

          if (nodeName === 'mike' && output.mikeResponse) {
            await writer.write(encoder.encode(sseMessage({
              type: 'agent_done',
              agent: 'mike',
              fullText: output.mikeResponse,
            })));
          }

          if (nodeName === 'emma' && output.emmaResponse) {
            await writer.write(encoder.encode(sseMessage({
              type: 'agent_done',
              agent: 'emma',
              fullText: output.emmaResponse,
            })));
          }

          if (nodeName === 'alex') {
            await writer.write(encoder.encode(sseMessage({
              type: 'agent_done',
              agent: 'alex',
              fullText: output.alexResponse || '',
            })));
            if (output.htmlCode) {
              await writer.write(encoder.encode(sseMessage({
                type: 'code_generated',
                code: output.htmlCode,
              })));
            }
          }
        }
      }

      await writer.write(encoder.encode(sseMessage({ type: 'done' })));
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      await writer.write(encoder.encode(sseMessage({ type: 'error', message: errMsg })));
    } finally {
      await writer.close();
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
