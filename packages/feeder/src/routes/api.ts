import { exec, spawn } from "child_process";
import { Router } from "express";
import { simpleGit } from "simple-git";
import { logger } from "../utils/logger";

const router = Router();

router.get("/ping", (_req, res) => {
  res.json({
    success: true,
    message: "Data feeder API is alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get("/train/github/:user/:repo", async (req, res) => {
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

  proc.on("close", (code) => {
    logger.info(`✅ Clone finished with exit code ${code}`);
    return res.json({
      success: true,
      message: `Training data for GitHub repository ${repo} owned by ${user}`,
      timestamp: new Date().toISOString(),
    });
  });
});

export default router;
