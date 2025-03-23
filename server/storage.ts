import { type Character, type InsertCharacter, type TutorialContent, type InsertTutorialContent, characters, tutorialContent } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Character methods
  getCharacters(): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacterHp(id: number, currentHp: number): Promise<Character>;
  updateCharacterInitiative(id: number, initiative: number): Promise<Character>;
  deleteCharacter(id: number): Promise<void>;
  deleteAllCharacters(): Promise<void>;

  // Tutorial content methods
  getTutorialContent(): Promise<TutorialContent[]>;
  createTutorialContent(content: InsertTutorialContent): Promise<TutorialContent>;
  updateTutorialContent(id: number, content: Partial<InsertTutorialContent>): Promise<TutorialContent>;
  updateCharacter(id: number, character: InsertCharacter): Promise<Character>;
}

export class DatabaseStorage implements IStorage {
  // Character methods
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

  // Tutorial content methods
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

export const storage = new DatabaseStorage();