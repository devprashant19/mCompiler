import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const TIMEOUT_MS = 60000; // 1 min timeout for interactive sessions

export default function initRunSocket(io) {
  io.on('connection', (socket) => {
    let currentProcess = null;
    let currentDir = null;
    let timer = null;

    const cleanup = async () => {
      if (currentProcess) {
        currentProcess.kill('SIGKILL');
        currentProcess = null;
      }
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (currentDir) {
        try {
          await fs.rm(currentDir, { recursive: true, force: true });
        } catch (e) {}
        currentDir = null;
      }
    };

    socket.on('disconnect', cleanup);
    socket.on('stop', cleanup);

    socket.on('run', async ({ code }) => {
      await cleanup(); // kill any existing process on this socket

      const id = randomUUID();
      const dir = path.join(process.cwd(), "tmp", id);
      currentDir = dir;

      try {
        await fs.mkdir(dir, { recursive: true });
        const sourcePath = path.join(dir, "main.cpp");
        const binaryPath = path.join(dir, process.platform === "win32" ? "main.exe" : "main");

        await fs.writeFile(sourcePath, code);

        socket.emit('output', { type: 'system', data: 'Compiling...\n' });
        
        // Use c++14 for wider compatibility with older MinGW versions locally
        const compiler = spawn('g++', ["-std=c++14", "-O2", sourcePath, "-o", binaryPath]);
        
        let compileError = '';
        compiler.stderr.on('data', (chunk) => { compileError += chunk.toString(); });
        
        compiler.on('close', (code) => {
          if (code !== 0) {
            socket.emit('output', { type: 'compile_error', data: compileError });
            socket.emit('exit', { status: 'Compilation Error', time_ms: 0 });
            return;
          }

          socket.emit('output', { type: 'system', data: 'Running...\n' });

          const start = Date.now();
          currentProcess = spawn(binaryPath, []);
          
          timer = setTimeout(() => {
            if (currentProcess) {
              currentProcess.kill("SIGKILL");
              socket.emit('exit', { status: 'Time Limit Exceeded', time_ms: Date.now() - start });
            }
          }, TIMEOUT_MS);

          currentProcess.stdout.on('data', (chunk) => {
            socket.emit('output', { type: 'stdout', data: chunk.toString() });
          });

          currentProcess.stderr.on('data', (chunk) => {
            socket.emit('output', { type: 'stderr', data: chunk.toString() });
          });

          currentProcess.on('close', (exitCode) => {
            clearTimeout(timer);
            if (currentProcess) { 
              currentProcess = null;
              socket.emit('exit', { 
                status: exitCode === 0 ? 'Success' : 'Runtime Error', 
                time_ms: Date.now() - start 
              });
            }
          });
          
          currentProcess.on('error', (err) => {
            socket.emit('output', { type: 'stderr', data: err.message });
            socket.emit('exit', { status: 'Runtime Error', time_ms: Date.now() - start });
          });
        });

      } catch (e) {
        socket.emit('output', { type: 'stderr', data: e.message });
        socket.emit('exit', { status: 'System Error', time_ms: 0 });
      }
    });

    socket.on('input', ({ data }) => {
      if (currentProcess && currentProcess.stdin) {
        currentProcess.stdin.write(data + '\n');
      }
    });
  });
}
