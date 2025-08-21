import { type VercelRequest, type VercelResponse } from "@vercel/node";
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { characters, type InsertCharacter } from '../shared/schema';

// Fun D&D-themed test data
const testCharacters: InsertCharacter[] = [
  // Player Characters (Heroes)
  {
    name: "Gandrix the Wise",
    initiative: 18,
    currentHp: 45,
    maxHp: 45,
    isNpc: false,
  },
  {
    name: "Thorin Ironforge",
    initiative: 12,
    currentHp: 68,
    maxHp: 75,
    isNpc: false,
  },
  {
    name: "Lyralei Windwhisper",
    initiative: 22,
    currentHp: 32,
    maxHp: 38,
    isNpc: false,
  },
  {
    name: "Zuko Flamefist",
    initiative: 15,
    currentHp: 42,
    maxHp: 52,
    isNpc: false,
  },
  {
    name: "Brother Marcus",
    initiative: 10,
    currentHp: 48,
    maxHp: 48,
    isNpc: false,
  },
  
  // Monsters & Enemies
  {
    name: "Ancient Red Dragon",
    initiative: 16,
    currentHp: 256,
    maxHp: 546,
    isNpc: true,
  },
  {
    name: "Goblin Scout #1",
    initiative: 14,
    currentHp: 7,
    maxHp: 7,
    isNpc: true,
  },
  {
    name: "Goblin Scout #2",
    initiative: 13,
    currentHp: 5,
    maxHp: 7,
    isNpc: true,
  },
  {
    name: "Goblin Warchief",
    initiative: 11,
    currentHp: 35,
    maxHp: 42,
    isNpc: true,
  },
  {
    name: "Owlbear",
    initiative: 9,
    currentHp: 45,
    maxHp: 59,
    isNpc: true,
  },
  {
    name: "Skeleton Warrior",
    initiative: 8,
    currentHp: 13,
    maxHp: 13,
    isNpc: true,
  },
  {
    name: "Dire Wolf Alpha",
    initiative: 17,
    currentHp: 28,
    maxHp: 37,
    isNpc: true,
  },
  {
    name: "Bandit Captain",
    initiative: 12,
    currentHp: 52,
    maxHp: 65,
    isNpc: true,
  },
  
  // Friendly NPCs
  {
    name: "Sir Reginald (Town Guard)",
    initiative: 6,
    currentHp: 32,
    maxHp: 32,
    isNpc: true,
  },
  {
    name: "Mysterious Hooded Figure",
    initiative: 20,
    currentHp: 1,
    maxHp: 1,
    isNpc: true,
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Add a secret key check for security
  const secretKey = req.headers['x-seed-key'] || req.query.key;
  if (secretKey !== process.env.SEED_SECRET && process.env.SEED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema: { characters } });

  try {
    // Clear existing characters
    await db.delete(characters);
    
    // Insert test characters
    const inserted = await db.insert(characters).values(testCharacters).returning();
    
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
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ 
      error: 'Failed to seed database',
      details: error.message 
    });
  } finally {
    await pool.end();
  }
}