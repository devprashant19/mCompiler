import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all nodes
router.get('/', (req, res) => {
  try {
    const nodes = db.prepare('SELECT * FROM nodes').all();
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new file or folder
router.post('/', (req, res) => {
  const { name, type, parent_id, content = '' } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO nodes (id, name, type, parent_id, content) VALUES (?, ?, ?, ?, ?)');
  
  try {
    stmt.run(id, name, type, parent_id || null, content);
    const newNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
    res.status(201).json(newNode);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update node (rename or update content)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, content } = req.body;

  let query = '';
  const params = [];
  
  if (name !== undefined && content !== undefined) {
    query = 'UPDATE nodes SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    params.push(name, content, id);
  } else if (name !== undefined) {
    query = 'UPDATE nodes SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    params.push(name, id);
  } else if (content !== undefined) {
    query = 'UPDATE nodes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    params.push(content, id);
  } else {
    return res.status(400).json({ error: 'Provide name or content to update' });
  }

  try {
    const info = db.prepare(query).run(...params);
    if (info.changes === 0) return res.status(404).json({ error: 'Node not found' });
    
    const updatedNode = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
    res.json(updatedNode);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete node
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare('DELETE FROM nodes WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Node not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
