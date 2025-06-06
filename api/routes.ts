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

  return createServer(app);
}