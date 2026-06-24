import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all nodes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await db.from('nodes').select('*');
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new file or folder
router.post('/', async (req, res) => {
  const { name, type, parent_id, content = '' } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  const id = uuidv4();
  
  try {
    const { data, error } = await db.from('nodes').insert([
      { id, name, type, parent_id: parent_id || null, content }
    ]).select().single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update node (rename or update content)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, content } = req.body;

  const updates = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (content !== undefined) updates.content = content;

  if (Object.keys(updates).length === 1) {
    return res.status(400).json({ error: 'Provide name or content to update' });
  }

  try {
    const { data, error } = await db.from('nodes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete node
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await db.from('nodes').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
