import express from "express";
import { type VercelRequest, type VercelResponse } from "@vercel/node";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { type Character, type InsertCharacter, type TutorialContent, type InsertTutorialContent, characters, tutorialContent, insertCharacterSchema, insertTutorialContentSchema } from "./schema";
import { createServer } from "http";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { characters, tutorialContent } });

// Storage class
class DatabaseStorage {
  async getCharacters(): Promise<Character[]> {
    return await db.select().from(characters).orderBy(characters.initiative);
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
      .values(content)
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

const storage = new DatabaseStorage();

// Create express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes inline
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
        return res.status(400).json({ message: "Invalid character data" });
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
      const schema = z.object({ currentHp: z.number().min(0) });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid HP value" });
      }

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
    try {
      const schema = z.object({ initiative: z.number().min(1).max(30) });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid initiative value" });
      }

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
        return res.status(400).json({ message: "Invalid tutorial content" });
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
      const result = insertTutorialContentSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid tutorial content" });
      }

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
    try {
      const result = insertCharacterSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid character data" });
      }

      const character = await storage.updateCharacter(
        parseInt(req.params.id),
        result.data
      );
      res.json(character);
    } catch (error) {
      res.status(404).json({ message: "Character not found" });
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