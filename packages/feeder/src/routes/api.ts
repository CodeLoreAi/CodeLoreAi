import { spawn } from "child_process";
import { Router } from "express";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";
// import { Parser } from "tree-sitter";
// import JavaScript from "tree-sitter-javascript";
// import { typescript, tsx } from "tree-sitter-typescript";
import { promisify } from "util";

const Parser = require("tree-sitter");
const JavaScript = require("tree-sitter-javascript");
const { typescript, tsx } = require("tree-sitter-typescript");
const router = Router();
const parser = new Parser();

const languageByExt = {
  ".js": JavaScript,
  ".jsx": JavaScript,
  ".ts": typescript,
  ".tsx": tsx,
};

// Promisify fs functions
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Recursively collect files
async function collectFiles(dir: string, result: string[] = []) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const fileStat = await stat(fullPath);
    if (fileStat.isDirectory()) {
      await collectFiles(fullPath, result);
    } else {
      result.push(fullPath);
    }
  }
  return result;
}

// Extract relevant chunks (functions/classes/methods)
function extractChunks(
  node: any,
  parent: any,
  depth: number,
  chunks: any[],
  code: string
) {
  const isRelevant =
    node.type === "function_declaration" ||
    node.type === "class_declaration" ||
    node.type === "method_definition";

  if (isRelevant) {
    const nameNode = node.childForFieldName("name") || node.namedChildren[0];
    const name = nameNode ? nameNode.text : "(anonymous)";
    logger.info(
      `Extracting ${node.type} "${name}" at ${node.startPosition.row + 1}-${
        node.endPosition.row + 1
      }`
    );
    chunks.push({
      id: `${node.type}@${node.startPosition.row + 1}-${
        node.endPosition.row + 1
      }`,
      type: node.type,
      name,
      text: code.slice(node.startIndex, node.endIndex),
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
      parentType: parent?.type ?? null,
      childrenTypes: node.namedChildren.map((c: any) => c.type),
      depth,
    });
  }

  for (let i = 0; i < node.namedChildCount; i++) {
    extractChunks(node.namedChild(i), node, depth + 1, chunks, code);
  }
}

// Process a single file and extract chunks
async function processFile(file: string, allChunks: any[]) {
  const ext = path.extname(file);
  const lang = languageByExt[ext];
  if (!lang) return;

  try {
    parser.setLanguage(lang);
    const code = await readFile(file, "utf8");
    const tree = parser.parse(code);
    const chunks: any[] = [];

    extractChunks(tree.rootNode, null, 0, chunks, code);

    for (const chunk of chunks) {
      chunk.filePath = path.relative(process.cwd(), file);
      chunk.language = ext.replace(".", "");
    }

    allChunks.push(...chunks);
  } catch (error) {
    logger.error(`Error processing file ${file}: ${error}`);
  }
}

router.get("/ping", (_req, res) => {
  res.json({
    success: true,
    message: "Data feeder API is alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get("/github/:user/:repo", async (req, res) => {
  const { user, repo } = req.params;
  if (!user || !repo) {
    return res.status(400).json({
      success: false,
      message: "User and repository parameters are required",
      timestamp: new Date().toISOString(),
    });
  }

  const repoUrl = `https://github.com/${user}/${repo}.git`;
  const dest = `codebases/${user}/${repo}`;

  try {
    // Clone the repository
    const proc = spawn("git", [
      "clone",
      "--depth",
      "1",
      "--progress",
      repoUrl,
      dest,
    ]);

    proc.stderr.on("data", (data) => {
      logger.info(`🔄 ${data}`);
    });

    // Wait for clone to complete
    await new Promise<void>((resolve, reject) => {
      proc.on("close", (code) => {
        if (code === 0) {
          logger.info(`✅ Clone finished with exit code ${code}`);
          resolve();
        } else {
          reject(new Error(`Git clone failed with code ${code}`));
        }
      });
    });

    // Process the cloned repository
    const codeFiles = await collectFiles(dest);
    const allChunks: any[] = [];

    // Process each file in parallel
    await Promise.all(codeFiles.map((file) => processFile(file, allChunks)));

    // Save the chunks
    const chunksPath = path.join(dest, "chunks.json");
    await writeFile(chunksPath, JSON.stringify(allChunks, null, 2));

    await fetch(`http://localhost:5000/embed-and-populate/${user}/${repo}`, {
      method: "GET",
    });

    return res.json({
      success: true,
      message: `Repository processed successfully. ${allChunks.length} chunks extracted.`,
      chunksPath: chunksPath,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error processing repository: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Error processing repository",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
