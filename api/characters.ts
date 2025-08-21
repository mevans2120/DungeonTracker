import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // GET /api/characters
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT id, name, initiative, current_hp as "currentHp", max_hp as "maxHp", is_npc as "isNpc" FROM characters ORDER BY is_npc ASC, initiative DESC'
      );
      return res.status(200).json(result.rows);
    }

    // POST /api/characters
    if (req.method === 'POST') {
      const { name, initiative, currentHp, maxHp, isNpc } = req.body;
      
      if (!name || !initiative || currentHp === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await pool.query(
        'INSERT INTO characters (name, initiative, current_hp, max_hp, is_npc) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, initiative, current_hp as "currentHp", max_hp as "maxHp", is_npc as "isNpc"',
        [name, initiative, currentHp, maxHp || null, isNpc || false]
      );
      return res.status(201).json(result.rows[0]);
    }

    // DELETE /api/characters (reset all)
    if (req.method === 'DELETE' && !req.url?.includes('/')) {
      await pool.query('DELETE FROM characters');
      return res.status(204).end();
    }

    return res.status(404).json({ error: 'Not found' });

  } catch (error: any) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Database error', 
      message: error.message 
    });
  } finally {
    await pool.end();
  }
}