import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from '@neondatabase/serverless';

const testCharacters = [
  // Player Characters
  { name: "Gandrix the Wise", initiative: 18, currentHp: 45, maxHp: 45, isNpc: false },
  { name: "Thorin Ironforge", initiative: 12, currentHp: 68, maxHp: 75, isNpc: false },
  { name: "Lyralei Windwhisper", initiative: 22, currentHp: 32, maxHp: 38, isNpc: false },
  { name: "Zuko Flamefist", initiative: 15, currentHp: 42, maxHp: 52, isNpc: false },
  { name: "Brother Marcus", initiative: 10, currentHp: 48, maxHp: 48, isNpc: false },
  // Monsters
  { name: "Ancient Red Dragon", initiative: 16, currentHp: 256, maxHp: 546, isNpc: true },
  { name: "Goblin Scout #1", initiative: 14, currentHp: 7, maxHp: 7, isNpc: true },
  { name: "Goblin Scout #2", initiative: 13, currentHp: 5, maxHp: 7, isNpc: true },
  { name: "Goblin Warchief", initiative: 11, currentHp: 35, maxHp: 42, isNpc: true },
  { name: "Owlbear", initiative: 9, currentHp: 45, maxHp: 59, isNpc: true },
  { name: "Skeleton Warrior", initiative: 8, currentHp: 13, maxHp: 13, isNpc: true },
  { name: "Dire Wolf Alpha", initiative: 17, currentHp: 28, maxHp: 37, isNpc: true },
  { name: "Bandit Captain", initiative: 12, currentHp: 52, maxHp: 65, isNpc: true },
  // NPCs
  { name: "Sir Reginald (Town Guard)", initiative: 6, currentHp: 32, maxHp: 32, isNpc: true },
  { name: "Mysterious Hooded Figure", initiative: 20, currentHp: 1, maxHp: 1, isNpc: true },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to seed database.' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Clear existing characters
    await pool.query('DELETE FROM characters');
    
    // Insert test characters
    const inserted = [];
    for (const char of testCharacters) {
      const result = await pool.query(
        'INSERT INTO characters (name, initiative, current_hp, max_hp, is_npc) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, initiative, current_hp as "currentHp", max_hp as "maxHp", is_npc as "isNpc"',
        [char.name, char.initiative, char.currentHp, char.maxHp || null, char.isNpc]
      );
      inserted.push(result.rows[0]);
    }
    
    const heroes = inserted.filter(c => !c.isNpc);
    const npcs = inserted.filter(c => c.isNpc);
    
    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully!',
      stats: {
        total: inserted.length,
        heroes: heroes.length,
        npcs: npcs.length,
        highestInitiative: Math.max(...inserted.map(c => c.initiative)),
        totalHp: inserted.reduce((sum, c) => sum + c.currentHp, 0)
      }
    });

  } catch (error: any) {
    console.error('Seed error:', error);
    return res.status(500).json({ 
      error: 'Failed to seed database', 
      message: error.message 
    });
  } finally {
    await pool.end();
  }
}