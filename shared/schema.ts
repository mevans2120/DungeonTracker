import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  initiative: integer("initiative").notNull(),
  currentHp: integer("current_hp").notNull(),
  maxHp: integer("max_hp"),
});

export const insertCharacterSchema = createInsertSchema(characters)
  .pick({
    name: true,
    initiative: true,
    currentHp: true,
    maxHp: true,
  })
  .extend({
    initiative: z.number().min(1).max(30),
    currentHp: z.number().min(0),
    maxHp: z.number().min(1).optional(),
  });

export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;
