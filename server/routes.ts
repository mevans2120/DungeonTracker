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

  // Tutorial content routes
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
    const schema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    });

    const result = schema.safeParse(req.body);
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
      console.error("Error updating tutorial content:", error);
      res.status(404).json({ message: "Tutorial content not found" });
    }
  });

  // Initialize tutorial content
  app.post("/api/tutorial/init", async (_req, res) => {
    try {
      await storage.clearTutorialContent();

      // Convert the default steps to the database format
      const defaultSteps = DEFAULT_TUTORIAL_STEPS.map(step => ({
        stepId: step.stepId,
        title: step.title,
        description: step.description,
        content: JSON.stringify(step.content)
      }));

      for (const step of defaultSteps) {
        await storage.createTutorialContent(step);
      }

      res.status(201).json({ message: "Tutorial content initialized" });
    } catch (error) {
      console.error("Error initializing tutorial content:", error);
      res.status(500).json({ message: "Failed to initialize tutorial content" });
    }
  });

  return createServer(app);
}

// Default tutorial steps
const DEFAULT_TUTORIAL_STEPS = [
  {
    stepId: 0,
    title: "Welcome to DungeonTracker!",
    description: "This quick tutorial will show you how to manage combat in your D&D game.",
    content: {
      type: "basic",
      text: "DungeonTracker helps you:\n- Track initiative order\n- Manage character HP\n- Keep combat flowing smoothly\n\nNo account or setup required - just add your characters and start playing!"
    }
  },
  {
    stepId: 1,
    title: "Adding Characters",
    description: "Start by adding your players and monsters to the combat.",
    content: {
      type: "basic",
      text: "Click the 'Add to Combat' button to open the character form.\n\nFor each character, enter:\n- Name: Character's name\n- Initiative: Their initiative roll (1-30)\n- Current HP: Starting hit points\n- Max HP: Optional maximum HP\n- NPC: Toggle for non-player characters"
    }
  },
  {
    stepId: 2,
    title: "Initiative Order",
    description: "Characters are automatically sorted by initiative.",
    content: {
      type: "basic",
      text: "The initiative list shows all characters in order:\n- Highest initiative goes first\n- PCs and NPCs are grouped separately\n- The current turn is highlighted\n- Use 'Next Turn' to advance combat"
    }
  }
];