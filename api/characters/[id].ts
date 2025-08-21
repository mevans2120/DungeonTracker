import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  // Extract ID from URL
  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // PATCH /api/characters/[id]
    if (req.method === 'PATCH') {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (req.body.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(req.body.name);
      }
      if (req.body.initiative !== undefined) {
        updates.push(`initiative = $${paramCount++}`);
        values.push(req.body.initiative);
      }
      if (req.body.currentHp !== undefined) {
        updates.push(`current_hp = $${paramCount++}`);
        values.push(req.body.currentHp);
      }
      if (req.body.maxHp !== undefined) {
        updates.push(`max_hp = $${paramCount++}`);
        values.push(req.body.maxHp);
      }
      if (req.body.isNpc !== undefined) {
        updates.push(`is_npc = $${paramCount++}`);
        values.push(req.body.isNpc);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);
      const query = `UPDATE characters SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, initiative, current_hp as "currentHp", max_hp as "maxHp", is_npc as "isNpc"`;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Character not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    }

    // DELETE /api/characters/[id]
    if (req.method === 'DELETE') {
      const result = await pool.query(
        'DELETE FROM characters WHERE id = $1 RETURNING id',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Character not found' });
      }
      
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });

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