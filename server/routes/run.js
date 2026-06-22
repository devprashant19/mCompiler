import express from 'express';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

const TIMEOUT_MS = 7000;
const MAX_OUTPUT_BYTES = 1_000_000;

async function runCpp(code, stdin = "") {
  const id = randomUUID();
  const dir = path.join(process.cwd(), "tmp", id);
  await fs.mkdir(dir, { recursive: true });
  const sourcePath = path.join(dir, "main.cpp");
  const binaryPath = path.join(dir, process.platform === "win32" ? "main.exe" : "main");

  try {
    await fs.writeFile(sourcePath, code);

    // 1. Compile
    const compileResult = await runProcess("g++", ["-std=c++17", "-O2", sourcePath, "-o", binaryPath], "", TIMEOUT_MS, MAX_OUTPUT_BYTES);
    if (compileResult.exitCode !== 0) {
      return { stdout: "", stderr: "", compile_output: compileResult.stderr, status: "Compilation Error", time_ms: compileResult.time_ms };
    }

    // 2. Run
    const runResult = await runProcess(binaryPath, [], stdin, TIMEOUT_MS, MAX_OUTPUT_BYTES);
    return {
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      compile_output: "",
      status: runResult.timedOut ? "Time Limit Exceeded" : runResult.truncated ? "Output Limit Exceeded" : runResult.exitCode === 0 ? "Success" : "Runtime Error",
      time_ms: runResult.time_ms,
    };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

function runProcess(cmd, args, stdin, timeoutMs, maxBytes) {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn(cmd, args);
    let stdout = "", stderr = "", truncated = false, timedOut = false;

    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      if (stdout.length < maxBytes) stdout += chunk.toString();
      else { truncated = true; child.kill("SIGKILL"); }
    });
    child.stderr.on("data", (chunk) => {
      if (stderr.length < maxBytes) stderr += chunk.toString();
    });

    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode, timedOut, truncated, time_ms: Date.now() - start });
    });
    
    child.on("error", (err) => {
        clearTimeout(timer);
        resolve({ stdout, stderr: err.message, exitCode: -1, timedOut, truncated, time_ms: Date.now() - start });
    });
  });
}

router.post('/', async (req, res) => {
  const { code, stdin = "" } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }
  
  try {
    const result = await runCpp(code, stdin);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
