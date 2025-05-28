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
    // Functions and classes
    node.type === "function_declaration" ||
    node.type === "class_declaration" ||
    node.type === "method_definition" ||
    // Arrow functions and function expressions
    node.type === "arrow_function" ||
    node.type === "function_expression" ||
    // Variable declarations with complex initialization
    (node.type === "variable_declaration" &&
      node.namedChildren?.some(
        (child) =>
          child.type === "object" ||
          child.type === "array" ||
          child.type === "arrow_function" ||
          child.type === "function_expression"
      )) ||
    // Object and array patterns
    node.type === "object_pattern" ||
    node.type === "array_pattern" ||
    // Interface and type definitions
    node.type === "interface_declaration" ||
    node.type === "type_alias_declaration" ||
    // Export declarations
    node.type === "export_statement" ||
    // Complex object literals
    (node.type === "object" && node.parent?.type !== "variable_declarator") ||
    // JSX components
    node.type === "jsx_element" ||
    node.type === "jsx_fragment" ||
    // Decorators and annotations
    node.type === "decorator" ||
    // Async functions and generators
    node.type === "generator_function_declaration" ||
    node.type === "generator_function_expression" ||
    // Switch cases with complex logic
    (node.type === "switch_case" && node.namedChildCount > 2) ||
    // Try-catch blocks
    node.type === "try_statement" ||
    // Complex if conditions
    (node.type === "if_statement" &&
      (node.consequence?.type === "statement_block" ||
        node.consequence?.namedChildCount > 1));
  if (isRelevant) {
    const nameNode = node.childForFieldName("name") || node.namedChildren[0];
    const name = nameNode ? nameNode.text : "(anonymous)";
    logger.info(
      `Extracting ${node.type} "${name}" at ${node.startPosition?.row + 1}-${
        node.endPosition?.row + 1
      }`
    );
    chunks.push({
      id: `${node.type}@${node.startPosition?.row + 1}-${
        node.endPosition?.row + 1
      }`,
      type: node.type,
      name,
      text: code.slice(node.startIndex, node.endIndex),
      startLine: node.startPosition?.row + 1,
      endLine: node.endPosition?.row + 1,
      parentType: parent?.type ?? null,
      childrenTypes: node.namedChildren?.map((c: any) => c.type),
      depth,
    });
  }

  // Add context for parent-child relationships
  const contextualParent = findContextualParent(node);
  if (contextualParent) {
    chunks.push({
      type: "context",
      parentType: contextualParent.type,
      childType: node.type,
      relationship: determineRelationship(contextualParent, node),
      scope: extractScope(node),
      text: code.slice(contextualParent.startIndex, contextualParent.endIndex),
    });
  }

  for (let i = 0; i < node.namedChildCount; i++) {
    extractChunks(node.namedChild(i), node, depth + 1, chunks, code);
  }
}

// Helper functions for enhanced context
function findContextualParent(node: any) {
  let current = node.parent;
  while (current) {
    if (isSignificantNode(current)) return current;
    current = current.parent;
  }
  return null;
}

function isSignificantNode(node: any) {
  return [
    "function_declaration",
    "class_declaration",
    "method_definition",
    "interface_declaration",
    "module",
    "namespace",
    "function_declaration",
    "class_declaration",
    "method_definition",
    "arrow_function",
    "function_expression",
    "variable_declaration",
    "object",
    "array",
    "arrow_function",
    "function_expression",
    "object_pattern",
    "array_pattern",
    "interface_declaration",
    "type_alias_declaration",
    "export_statement",
    "object",
    "jsx_element",
    "jsx_fragment",
    "decorator",
    "generator_function_declaration",
    "generator_function_expression",
    "switch_case",
    "try_statement",
    "if_statement",
    "statement_block",
  ].includes(node.type);
}

function determineRelationship(parent: any, child: any) {
  if (parent.type === "class_declaration" && child.type === "method_definition")
    return "class_method";
  if (
    parent.type === "interface_declaration" &&
    child.type === "method_definition"
  )
    return "interface_method";
  if (
    parent.type === "function_declaration" &&
    child.type === "function_declaration"
  )
    return "nested_function";
  return "contained";
}

function extractScope(node: any) {
  return {
    variables: node
      .descendantsOfType("variable_declaration")
      .map((v: any) => v.text),
    imports: node.descendantsOfType("import_statement").map((i: any) => i.text),
    dependencies: node
      .descendantsOfType("call_expression")
      .map((c: any) => c.childForFieldName("function")?.text)
      .filter(Boolean),
  };
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
      // Add file-level metadata
      chunk.fileContext = {
        imports: tree.rootNode
          .descendantsOfType("import_statement")
          .map((imp: any) => imp.text),
        exports: tree.rootNode
          .descendantsOfType("export_statement")
          .map((exp: any) => exp.text),
        globalScope: tree.rootNode
          .descendantsOfType("variable_declaration")
          .filter((v: any) => !v.hasAncestor("function_declaration"))
          .map((v: any) => v.text),
      };
    }

    const processedChunks = processChunkRelationships(chunks);
    allChunks.push(...processedChunks);
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
        if (code === 0 || 128) {
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
      error: error?.message,
      timestamp: new Date().toISOString(),
    });
  }
});

router.get("/list", async (req, res) => {
  const root = "./codebases";
  const owners = await readdir(root);
  const repos = owners.reduce<{ owner: string; repo: string }[]>(
    (acc, owner) => {
      const ownerPath = path.join(root, owner);
      if (fs.statSync(ownerPath).isDirectory()) {
        const repos = fs.readdirSync(ownerPath);
        repos.forEach((repo) => {
          const repoPath = path.join(ownerPath, repo);
          if (fs.statSync(repoPath).isDirectory()) {
            acc.push({ owner, repo });
          }
        });
      }
      return acc;
    },
    []
  );
  res.json({ success: true, repos });
});

export default router;

function processChunkRelationships(chunks: any[]) {
  return chunks.map((chunk) => ({
    ...chunk,
    relationships: {
      // Find chunks that import this chunk
      importedBy: chunks
        .filter((c) => c.imports?.some((imp) => imp.includes(chunk.name)))
        .map((c) => c.id),
      // Find chunks that are called by this chunk
      calledBy: chunks
        .filter((c) => c.dependencies?.externalCalls.includes(chunk.name))
        .map((c) => c.id),
      // Find parent-child relationships
      children: chunks
        .filter((c) => c.parentType === chunk.type && c.depth > chunk.depth)
        .map((c) => c.id),
    },
  }));
}
