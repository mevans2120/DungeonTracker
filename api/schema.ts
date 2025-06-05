import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  initiative: integer("initiative").notNull(),
  currentHp: integer("current_hp").notNull(),
  maxHp: integer("max_hp"),
  isNpc: boolean("is_npc").notNull().default(false),
});

// Updated tutorial content table with proper timestamp fields
export const tutorialContent = pgTable("tutorial_content", {
  id: serial("id").primaryKey(),
  stepId: integer("step_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCharacterSchema = createInsertSchema(characters)
  .pick({
    name: true,
    initiative: true,
    currentHp: true,
    maxHp: true,
    isNpc: true,
  })
  .extend({
    initiative: z.number().min(1).max(30),
    currentHp: z.number().min(0),
    maxHp: z.number().min(1).optional(),
    isNpc: z.boolean().default(false),
  });

export const insertTutorialContentSchema = createInsertSchema(tutorialContent)
  .pick({
    stepId: true,
    title: true,
    description: true,
    content: true,
  })
  .extend({
    stepId: z.number().min(0),
    content: z.any(), // We'll store the JSX content as JSON
  });

export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;
export type TutorialContent = typeof tutorialContent.$inferSelect;
export type InsertTutorialContent = z.infer<typeof insertTutorialContentSchema>;