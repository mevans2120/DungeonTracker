import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const id = req.query.id as string;
  const { currentHp } = req.body;

  if (!id || currentHp === undefined) {
    return res.status(400).json({ error: 'ID and currentHp are required' });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const result = await pool.query(
      'UPDATE characters SET current_hp = $1 WHERE id = $2 RETURNING id, name, initiative, current_hp as "currentHp", max_hp as "maxHp", is_npc as "isNpc"',
      [currentHp, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    return res.status(200).json(result.rows[0]);

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