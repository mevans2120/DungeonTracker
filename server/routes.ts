import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertCharacterSchema, insertTutorialContentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express) {
  // Existing character routes
  app.get("/api/characters", async (_req, res) => {
    const characters = await storage.getCharacters();
    res.json(characters);
  });

  app.post("/api/characters", async (req, res) => {
    const result = insertCharacterSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid character data" });
    }
    const character = await storage.createCharacter(result.data);
    res.status(201).json(character);
  });

  app.patch("/api/characters/:id/hp", async (req, res) => {
    const schema = z.object({ currentHp: z.number().min(0) });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid HP value" });
    }

    try {
      const character = await storage.updateCharacterHp(
        parseInt(req.params.id),
        result.data.currentHp
      );
      res.json(character);
    } catch (error) {
      res.status(404).json({ message: "Character not found" });
    }
  });

  app.patch("/api/characters/:id/initiative", async (req, res) => {
    const schema = z.object({ initiative: z.number().min(1).max(30) });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid initiative value" });
    }

    try {
      const character = await storage.updateCharacterInitiative(
        parseInt(req.params.id),
        result.data.initiative
      );
      res.json(character);
    } catch (error) {
      res.status(404).json({ message: "Character not found" });
    }
  });

  app.delete("/api/characters/:id", async (req, res) => {
    try {
      await storage.deleteCharacter(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ message: "Character not found" });
    }
  });

  app.delete("/api/characters", async (_req, res) => {
    await storage.deleteAllCharacters();
    res.status(204).send();
  });

  // New tutorial content routes
  app.get("/api/tutorial", async (_req, res) => {
    const content = await storage.getTutorialContent();
    res.json(content);
  });

  app.post("/api/tutorial", async (req, res) => {
    const result = insertTutorialContentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid tutorial content" });
    }
    const content = await storage.createTutorialContent(result.data);
    res.status(201).json(content);
  });

  app.patch("/api/tutorial/:id", async (req, res) => {
    const result = insertTutorialContentSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid tutorial content" });
    }

    try {
      const content = await storage.updateTutorialContent(
        parseInt(req.params.id),
        result.data
      );
      res.json(content);
    } catch (error) {
      res.status(404).json({ message: "Tutorial content not found" });
    }
  });

  app.patch("/api/characters/:id", async (req, res) => {
    const result = insertCharacterSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid character data" });
    }

    try {
      const character = await storage.updateCharacter(
        parseInt(req.params.id),
        result.data
      );
      res.json(character);
    } catch (error) {
      res.status(404).json({ message: "Character not found" });
    }
  });

  // Seed route for populating database with test data
  app.post("/api/seed", async (_req, res) => {
    try {
      // Test data
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

      // Clear existing characters
      await storage.deleteAllCharacters();
      
      // Insert test characters
      const inserted = [];
      for (const char of testCharacters) {
        const character = await storage.createCharacter(char);
        inserted.push(character);
      }
      
      const heroes = inserted.filter(c => !c.isNpc);
      const npcs = inserted.filter(c => c.isNpc);
      
      res.status(200).json({
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
      res.status(500).json({ 
        error: 'Failed to seed database',
        details: error.message 
      });
    }
  });

  return createServer(app);
}