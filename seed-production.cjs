#!/usr/bin/env node

/**
 * Seed production database
 * Usage: DATABASE_URL="your-neon-url" node seed-production.js
 */

const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.error('Usage: DATABASE_URL="your-neon-url" node seed-production.js');
    process.exit(1);
  }

  const testCharacters = [
    // Player Characters
    { name: "Gandrix the Wise", initiative: 18, current_hp: 45, max_hp: 45, is_npc: false },
    { name: "Thorin Ironforge", initiative: 12, current_hp: 68, max_hp: 75, is_npc: false },
    { name: "Lyralei Windwhisper", initiative: 22, current_hp: 32, max_hp: 38, is_npc: false },
    { name: "Zuko Flamefist", initiative: 15, current_hp: 42, max_hp: 52, is_npc: false },
    { name: "Brother Marcus", initiative: 10, current_hp: 48, max_hp: 48, is_npc: false },
    // Monsters
    { name: "Ancient Red Dragon", initiative: 16, current_hp: 256, max_hp: 546, is_npc: true },
    { name: "Goblin Scout #1", initiative: 14, current_hp: 7, max_hp: 7, is_npc: true },
    { name: "Goblin Scout #2", initiative: 13, current_hp: 5, max_hp: 7, is_npc: true },
    { name: "Goblin Warchief", initiative: 11, current_hp: 35, max_hp: 42, is_npc: true },
    { name: "Owlbear", initiative: 9, current_hp: 45, max_hp: 59, is_npc: true },
    { name: "Skeleton Warrior", initiative: 8, current_hp: 13, max_hp: 13, is_npc: true },
    { name: "Dire Wolf Alpha", initiative: 17, current_hp: 28, max_hp: 37, is_npc: true },
    { name: "Bandit Captain", initiative: 12, current_hp: 52, max_hp: 65, is_npc: true },
    // NPCs
    { name: "Sir Reginald (Town Guard)", initiative: 6, current_hp: 32, max_hp: 32, is_npc: true },
    { name: "Mysterious Hooded Figure", initiative: 20, current_hp: 1, max_hp: 1, is_npc: true },
  ];

  console.log('🎲 Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Clear existing characters
    console.log('🧹 Clearing existing characters...');
    await pool.query('DELETE FROM characters');
    
    // Insert test characters
    console.log('⚔️ Inserting adventurers and monsters...');
    for (const char of testCharacters) {
      await pool.query(
        'INSERT INTO characters (name, initiative, current_hp, max_hp, is_npc) VALUES ($1, $2, $3, $4, $5)',
        [char.name, char.initiative, char.current_hp, char.max_hp, char.is_npc]
      );
    }
    
    console.log(`✅ Successfully inserted ${testCharacters.length} characters!`);
    console.log('🎯 Database seeded successfully! Ready for epic battles!');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();