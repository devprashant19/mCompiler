import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { createServer } from 'http';
import { Server } from 'socket.io';

import nodesRouter from './routes/nodes.js';
import uploadRouter from './routes/upload.js';
import runRouter from './routes/run.js';
import initRunSocket from './socket/run.js';

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 5000;

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      process.env.VITE_API_BASE_URL,
      process.env.FRONTEND_URL
    ].filter(Boolean)
  }
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.VITE_API_BASE_URL,
    process.env.FRONTEND_URL
  ].filter(Boolean)
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/nodes', nodesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/run', runRouter);

app.get('/api/health', (req, res) => {
  exec('g++ --version', (err, stdout, stderr) => {
    res.json({ status: 'ok', gpp: !err, gpp_version: stdout ? stdout.split('\n')[0] : null });
  });
});

initRunSocket(io);

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
  exec('g++ --version', (err) => {
    if (err) {
      console.warn("WARNING: g++ is not installed or not in PATH. Code execution will fail.");
    }
  });
});
