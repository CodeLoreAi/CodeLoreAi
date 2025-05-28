import express from "express";
import cors from "cors";
import { CodeAgent } from "../agent/codeAgent.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3030;

// Initialize Code Agent
const codeAgent = new CodeAgent();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(
    `📨 [API] ${new Date().toISOString()} - ${req.method} ${req.path}`
  );
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    agent: "Code Query Agent",
    version: "1.0.0",
  });
});

// Main code query endpoint
app.post("/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params;
  const { threadId, message } = req.body;

  // Validation
  if (!threadId) {
    return res.status(400).json({
      success: false,
      error: "threadId is required in request body",
    });
  }

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "message is required in request body",
    });
  }

  try {
    console.log(`🔍 [API] Code query request:`);
    console.log(`   Repository: ${owner}/${repo}`);
    console.log(`   Thread ID: ${threadId}`);
    console.log(`   Message: ${message}`);

    const result = await codeAgent.processQuery(threadId, message, owner, repo);

    if (result.success) {
      res.json({
        success: true,
        response: result.response,
        repository: `${owner}/${repo}`,
        threadId: threadId,
        timestamp: result.timestamp,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        repository: `${owner}/${repo}`,
        threadId: threadId,
        timestamp: result.timestamp,
      });
    }
  } catch (error) {
    console.error(`🚨 [API] Unexpected error:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      repository: `${owner}/${repo}`,
      threadId: threadId,
      timestamp: new Date().toISOString(),
    });
  }
});

// General code query endpoint (without specific repo)
app.post("/query", async (req, res) => {
  const { threadId, message } = req.body;

  // Validation
  if (!threadId) {
    return res.status(400).json({
      success: false,
      error: "threadId is required in request body",
    });
  }

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "message is required in request body",
    });
  }

  try {
    console.log(`🔍 [API] General code query request:`);
    console.log(`   Thread ID: ${threadId}`);
    console.log(`   Message: ${message}`);

    const result = await codeAgent.processQuery(threadId, message);

    if (result.success) {
      res.json({
        success: true,
        response: result.response,
        threadId: threadId,
        timestamp: result.timestamp,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        threadId: threadId,
        timestamp: result.timestamp,
      });
    }
  } catch (error) {
    console.error(`🚨 [API] Unexpected error:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      threadId: threadId,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get thread history endpoint
app.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    console.log(`📜 [API] Thread history request for: ${threadId}`);

    const result = await codeAgent.getThreadHistory(threadId);

    if (result.success) {
      res.json({
        success: true,
        messages: result.messages,
        threadId: threadId,
        messageCount: result.messages.length,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        threadId: threadId,
      });
    }
  } catch (error) {
    console.error(`🚨 [API] Error getting thread history:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      threadId: threadId,
    });
  }
});

// Multi-repository search endpoint
app.post("/multi-search", async (req, res) => {
  const { threadId, message, repositories } = req.body;

  // Validation
  if (!threadId) {
    return res.status(400).json({
      success: false,
      error: "threadId is required in request body",
    });
  }

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "message is required in request body",
    });
  }

  if (!repositories || !Array.isArray(repositories)) {
    return res.status(400).json({
      success: false,
      error: "repositories array is required in request body",
    });
  }

  try {
    console.log(`🔍 [API] Multi-repository search request:`);
    console.log(`   Thread ID: ${threadId}`);
    console.log(`   Message: ${message}`);
    console.log(`   Repositories: ${repositories.join(", ")}`);

    // Enhance message with multi-repo context
    const enhancedMessage = `Search across these repositories [${repositories.join(
      ", "
    )}]: ${message}`;

    const result = await codeAgent.processQuery(threadId, enhancedMessage);

    if (result.success) {
      res.json({
        success: true,
        response: result.response,
        repositories: repositories,
        threadId: threadId,
        timestamp: result.timestamp,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        repositories: repositories,
        threadId: threadId,
        timestamp: result.timestamp,
      });
    }
  } catch (error) {
    console.error(`🚨 [API] Unexpected error:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      repositories: repositories,
      threadId: threadId,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`🚨 [API] Unhandled error:`, err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    timestamp: new Date().toISOString(),
  });
});
// Start server
app.listen(port, () => {
  console.log(`🚀 Code Query Agent API Server`);
  console.log(`📡 Running on: http://localhost:${port}`);
});

export default app;
