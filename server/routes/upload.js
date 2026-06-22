import express from 'express';
import multer from 'multer';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const upload = multer();

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { parent_id } = req.body;
  const name = req.file.originalname;
  const content = req.file.buffer.toString('utf8');

  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO nodes (id, name, type, parent_id, content) VALUES (?, ?, ?, ?, ?)');
  
  try {
    stmt.run(id, name, 'file', parent_id || null, content);
    const newNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
    res.status(201).json(newNode);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
