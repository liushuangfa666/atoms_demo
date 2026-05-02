import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { SYSTEM_PROMPTS } from "./agents";

// Define pipeline state
const PipelineState = Annotation.Root({
  userInput: Annotation<string>,
  mikeResponse: Annotation<string>,
  emmaResponse: Annotation<string>,
  alexResponse: Annotation<string>,
  htmlCode: Annotation<string>,
});

// Create MiniMax LLM via OpenAI-compatible interface
function createLLM() {
  return new ChatOpenAI({
    modelName: "MiniMax-Text-01",
    temperature: 0.7,
    maxTokens: 8192,
    configuration: {
      baseURL: "https://api.minimax.chat/v1",
      apiKey: process.env.MINIMAX_API_KEY,
    },
  });
}

// Node 1: Mike analyzes user request
async function mikeNode(state: typeof PipelineState.State) {
  const llm = createLLM();
  const response = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPTS.mike),
    new HumanMessage(state.userInput),
  ]);
  return { mikeResponse: response.content as string };
}

// Node 2: Emma creates product plan
async function emmaNode(state: typeof PipelineState.State) {
  const llm = createLLM();
  const response = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPTS.emma),
    new HumanMessage(`用户需求: ${state.userInput}\n\nMike的分析: ${state.mikeResponse}`),
  ]);
  return { emmaResponse: response.content as string };
}

// Node 3: Alex generates code
async function alexNode(state: typeof PipelineState.State) {
  const llm = createLLM();
  const response = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPTS.alex),
    new HumanMessage(`用户需求: ${state.userInput}\n\n产品规划:\n${state.emmaResponse}`),
  ]);

  const text = response.content as string;
  // Extract HTML from response
  const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i) ||
                    text.match(/<html[\s\S]*<\/html>/i);
  const htmlCode = htmlMatch ? htmlMatch[0] : text;

  return { alexResponse: text, htmlCode };
}

// Build the graph: Mike → Emma → Alex
const builder = new StateGraph(PipelineState)
  .addNode("mike", mikeNode)
  .addNode("emma", emmaNode)
  .addNode("alex", alexNode)
  .addEdge(START, "mike")
  .addEdge("mike", "emma")
  .addEdge("emma", "alex")
  .addEdge("alex", END);

export const agentGraph = builder.compile();
export { PipelineState };
