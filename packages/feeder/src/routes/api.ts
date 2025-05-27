import { spawn } from "child_process";
import { Router } from "express";
import { logger } from "../utils/logger";
import unzipper from "unzipper";
import multer from "multer";

import fs from "fs";
import path from "path";

const router = Router();

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

const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
      timestamp: new Date().toISOString(),
    });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;
  const destDir = path.join("codebases", path.parse(originalName).name);

  try {
    // If zip, extract; if directory, move/copy
    if (originalName.endsWith(".zip")) {
      await fs.promises.mkdir(destDir, { recursive: true });
      await fs
        .createReadStream(filePath)
        .pipe(unzipper.Extract({ path: destDir }))
        .promise();
      logger.info(`✅ Extracted zip to ${destDir}`);
    } else {
      // Assume it's a directory archive (e.g., tar), or just move the file
      await fs.promises.mkdir(destDir, { recursive: true });
      await fs.promises.rename(filePath, path.join(destDir, originalName));
      logger.info(`✅ Moved file to ${destDir}`);
    }

    // Cleanup uploaded file if needed
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    return res.json({
      success: true,
      message: `Training data uploaded and extracted to ${destDir}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`❌ Error processing upload: ${err}`);
    return res.status(500).json({
      success: false,
      message: "Failed to process uploaded file",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
