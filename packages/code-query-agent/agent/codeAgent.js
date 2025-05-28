import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import {
  codeQueryTool,
  multiRepoQueryTool,
  analyzeCodeTool,
} from "../tools/index.js";
import dotenv from "dotenv";

dotenv.config();
// 🤖 Model Configuration
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: process.env.OPENROUTER_API_BASE,
  },
  modelName: "anthropic/claude-sonnet-4",
  temperature: 0,
});

// 🧰 Tools Array
const tools = [codeQueryTool, multiRepoQueryTool, analyzeCodeTool];
const toolNode = new ToolNode(tools);

// Bind tools to model
const modelWithTools = model.bindTools(tools);

// 🧠 Agent State and Logic
const agentState = MessagesAnnotation;

// 🎯 Decision Function
function shouldContinue(state) {
  const lastMessage = state.messages[state.messages.length - 1];
  console.log(`🤔 [AGENT] Deciding next step...`);

  if (lastMessage.tool_calls?.length) {
    console.log(
      `🔧 [AGENT] Using tools: ${lastMessage.tool_calls
        .map((tc) => tc.name)
        .join(", ")}`
    );
    return "tools";
  }

  console.log(`✅ [AGENT] Task complete, ending conversation`);
  return "__end__";
}

// 🤖 Agent Function
async function callModel(state) {
  console.log(`\n🤖 [AGENT] Processing code query...`);

  // Enhanced system prompt for code analysis
  const systemMessage = {
    role: "system",
    content: `You are an expert code analysis assistant that helps developers understand and work with code repositories. 

When users ask about code functionality, implementation patterns, or how to accomplish specific tasks:
1. Use the appropriate tool to search the vector database for relevant code
2. Analyze the returned code snippets in context
3. Provide clear, practical explanations and examples
4. Focus on code functionality, patterns, and implementation details
5. If multiple code snippets are returned, synthesize the information to give comprehensive answers

Always format code snippets clearly and explain their purpose and usage.`,
  };

  const messagesWithSystem = [systemMessage, ...state.messages];
  const response = await modelWithTools.invoke(messagesWithSystem);
  console.log(`💭 [AGENT] Generated code analysis response`);
  return { messages: [response] };
}

// 🔧 Tools Function with Enhanced Logging
async function callTools(state) {
  console.log(`\n🔧 [TOOLS] Executing code search tools...`);
  const result = await toolNode.invoke(state);
  console.log(`✅ [TOOLS] Code search complete\n`);
  return result;
}

// 🌐 Build the Graph
const workflow = new StateGraph(agentState)
  .addNode("agent", callModel)
  .addNode("tools", callTools)
  .addEdge("__start__", "agent")
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

// 💾 Memory Setup
const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });

// 🚀 Code Agent Class
export class CodeAgent {
  constructor() {
    this.app = app;
    this.memory = memory;
  }

  async processQuery(threadId, message, owner = null, repo = null) {
    const config = { configurable: { thread_id: threadId } };

    try {
      console.log(`🎯 [CODE AGENT] Processing query for thread: ${threadId}`);
      console.log(`📝 Query: ${message}`);

      // If owner and repo are provided, enhance the message with context
      let enhancedMessage = message;
      if (owner && repo) {
        enhancedMessage = `In the repository ${owner}/${repo}: ${message}`;
      }

      console.log("waiting for resutl");

      const result = await this.app.invoke(
        {
          messages: [new HumanMessage(enhancedMessage)],
        },
        config
      );

      console.log("received resutl", { result });

      const response = result.messages.at(-1).content;
      console.log(`✅ [CODE AGENT] Query processed successfully`);

      return {
        success: true,
        response: response,
        threadId: threadId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`🚨 [CODE AGENT] Error processing query:`, error);
      return {
        success: false,
        error: error.message,
        threadId: threadId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getThreadHistory(threadId) {
    try {
      const config = { configurable: { thread_id: threadId } };
      const state = await this.app.getState(config);

      return {
        success: true,
        messages: state.values.messages || [],
        threadId: threadId,
      };
    } catch (error) {
      console.error(`🚨 [CODE AGENT] Error getting thread history:`, error);
      return {
        success: false,
        error: error.message,
        threadId: threadId,
      };
    }
  }
}
