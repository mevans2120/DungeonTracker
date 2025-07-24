import express from "express";
import { type VercelRequest, type VercelResponse } from "@vercel/node";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { z } from "zod";

// Import shared schema and types
import {
  characters,
  tutorialContent,
  insertCharacterSchema,
  insertTutorialContentSchema,
  type Character,
  type TutorialContent,
  type InsertCharacter,
  type InsertTutorialContent
} from '../shared/schema';

// Import storage interface and create a Vercel-specific implementation
import { type IStorage } from '../server/storage';
import { eq } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { characters, tutorialContent } });

// Vercel-specific storage implementation with connection pooling optimization
class VercelDatabaseStorage implements IStorage {
  async getCharacters(): Promise<Character[]> {
    return await db.select().from(characters).orderBy(characters.isNpc, characters.initiative);
  }

  async createCharacter(insertChar: InsertCharacter): Promise<Character> {
    const [character] = await db.insert(characters).values(insertChar).returning();
    return character;
  }

  async updateCharacterHp(id: number, currentHp: number): Promise<Character> {
    const [character] = await db
      .update(characters)
      .set({ currentHp })
      .where(eq(characters.id, id))
      .returning();

    if (!character) {
      throw new Error("Character not found");
    }
    return character;
  }

  async updateCharacterInitiative(id: number, initiative: number): Promise<Character> {
    const [character] = await db
      .update(characters)
      .set({ initiative })
      .where(eq(characters.id, id))
      .returning();

    if (!character) {
      throw new Error("Character not found");
    }
    return character;
  }

  async deleteCharacter(id: number): Promise<void> {
    const result = await db.delete(characters).where(eq(characters.id, id));
    if (!result) {
      throw new Error("Character not found");
    }
  }

  async deleteAllCharacters(): Promise<void> {
    await db.delete(characters);
  }

  async getTutorialContent(): Promise<TutorialContent[]> {
    return await db.select().from(tutorialContent).orderBy(tutorialContent.stepId);
  }

  async createTutorialContent(content: InsertTutorialContent): Promise<TutorialContent> {
    const [tutorial] = await db
      .insert(tutorialContent)
      .values({
        stepId: content.stepId,
        title: content.title,
        description: content.description,
        content: content.content,
      })
      .returning();
    return tutorial;
  }

  async updateTutorialContent(id: number, content: Partial<InsertTutorialContent>): Promise<TutorialContent> {
    const [tutorial] = await db
      .update(tutorialContent)
      .set({
        ...content,
        updatedAt: new Date(),
      })
      .where(eq(tutorialContent.id, id))
      .returning();

    if (!tutorial) {
      throw new Error("Tutorial content not found");
    }
    return tutorial;
  }

  async updateCharacter(id: number, character: InsertCharacter): Promise<Character> {
    const [updated] = await db
      .update(characters)
      .set(character)
      .where(eq(characters.id, id))
      .returning();

    if (!updated) {
      throw new Error("Character not found");
    }
    return updated;
  }
}

const storage = new VercelDatabaseStorage();

// Create express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Improved parameter validation helper
function validateIdParam(id: string): number {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error("Invalid ID parameter");
  }
  return parsed;
}

// Register API routes with improved error handling and validation
let routesRegistered = false;

async function registerRoutes() {
  if (routesRegistered) return;

  // Character routes
  app.get("/api/characters", async (_req, res) => {
    try {
      const characters = await storage.getCharacters();
      res.json(characters);
    } catch (error) {
      console.error('Get characters error:', error);
      res.status(500).json({ error: 'Failed to get characters' });
    }
  });

  app.post("/api/characters", async (req, res) => {
    try {
      const result = insertCharacterSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid character data",
          errors: result.error.errors
        });
      }
      const character = await storage.createCharacter(result.data);
      res.status(201).json(character);
    } catch (error) {
      console.error('Create character error:', error);
      res.status(500).json({ error: 'Failed to create character' });
    }
  });

  app.patch("/api/characters/:id/hp", async (req, res) => {
    try {
      const id = validateIdParam(req.params.id);
      const schema = z.object({ currentHp: z.number().min(0) });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid HP value",
          errors: result.error.errors
        });
      }

      const character = await storage.updateCharacterHp(id, result.data.currentHp);
      res.json(character);
    } catch (error) {
      if (error.message === "Invalid ID parameter") {
        res.status(400).json({ message: error.message });
      } else {
        res.status(404).json({ message: "Character not found" });
      }
    }
  });

  app.patch("/api/characters/:id/initiative", async (req, res) => {
    try {
      const id = validateIdParam(req.params.id);
      const schema = z.object({ initiative: z.number().min(1).max(30) });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid initiative value",
          errors: result.error.errors
        });
      }

      const character = await storage.updateCharacterInitiative(id, result.data.initiative);
      res.json(character);
    } catch (error) {
      if (error.message === "Invalid ID parameter") {
        res.status(400).json({ message: error.message });
      } else {
        res.status(404).json({ message: "Character not found" });
      }
    }
  });

  app.delete("/api/characters/:id", async (req, res) => {
    try {
      const id = validateIdParam(req.params.id);
      await storage.deleteCharacter(id);
      res.status(204).send();
    } catch (error) {
      if (error.message === "Invalid ID parameter") {
        res.status(400).json({ message: error.message });
      } else {
        res.status(404).json({ message: "Character not found" });
      }
    }
  });

  app.delete("/api/characters", async (_req, res) => {
    try {
      await storage.deleteAllCharacters();
      res.status(204).send();
    } catch (error) {
      console.error('Delete all characters error:', error);
      res.status(500).json({ error: 'Failed to delete characters' });
    }
  });

  // Tutorial routes
  app.get("/api/tutorial", async (_req, res) => {
    try {
      const content = await storage.getTutorialContent();
      res.json(content);
    } catch (error) {
      console.error('Get tutorial error:', error);
      res.status(500).json({ error: 'Failed to get tutorial content' });
    }
  });

  app.post("/api/tutorial", async (req, res) => {
    try {
      const result = insertTutorialContentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid tutorial content",
          errors: result.error.errors
        });
      }
      const content = await storage.createTutorialContent(result.data);
      res.status(201).json(content);
    } catch (error) {
      console.error('Create tutorial error:', error);
      res.status(500).json({ error: 'Failed to create tutorial content' });
    }
  });

  app.patch("/api/tutorial/:id", async (req, res) => {
    try {
      const id = validateIdParam(req.params.id);
      const result = insertTutorialContentSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid tutorial content",
          errors: result.error.errors
        });
      }

      const content = await storage.updateTutorialContent(id, result.data);
      res.json(content);
    } catch (error) {
      if (error.message === "Invalid ID parameter") {
        res.status(400).json({ message: error.message });
      } else {
        res.status(404).json({ message: "Tutorial content not found" });
      }
    }
  });

  app.patch("/api/characters/:id", async (req, res) => {
    try {
      const id = validateIdParam(req.params.id);
      const result = insertCharacterSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid character data",
          errors: result.error.errors
        });
      }

      const character = await storage.updateCharacter(id, result.data);
      res.json(character);
    } catch (error) {
      if (error.message === "Invalid ID parameter") {
        res.status(400).json({ message: error.message });
      } else {
        res.status(404).json({ message: "Character not found" });
      }
    }
  });

  routesRegistered = true;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await registerRoutes();
    
    // Handle the request with Express
    return new Promise((resolve, reject) => {
      app(req as any, res as any, (err: any) => {
        if (err) {
          console.error('API Error:', err);
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error('Handler Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
} 