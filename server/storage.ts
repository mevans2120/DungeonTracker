import { type Character, type InsertCharacter, type TutorialContent, type InsertTutorialContent } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private characters: Map<number, Character>;
  private tutorialContent: Map<number, TutorialContent>;
  private currentId: number;
  private currentTutorialId: number;

  constructor() {
    this.characters = new Map();
    this.tutorialContent = new Map();
    this.currentId = 1;
    this.currentTutorialId = 1;
  }

  // Existing character methods remain unchanged
  async getCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values())
      .sort((a, b) => b.initiative - a.initiative);
  }

  async createCharacter(insertChar: InsertCharacter): Promise<Character> {
    const id = this.currentId++;
    const character: Character = {
      ...insertChar,
      id,
      isNpc: insertChar.isNpc ?? false,
      maxHp: insertChar.maxHp ?? null
    };
    this.characters.set(id, character);
    return character;
  }

  async updateCharacterHp(id: number, currentHp: number): Promise<Character> {
    const character = this.characters.get(id);
    if (!character) {
      throw new Error("Character not found");
    }
    const updated = { ...character, currentHp };
    this.characters.set(id, updated);
    return updated;
  }

  async updateCharacterInitiative(id: number, initiative: number): Promise<Character> {
    const character = this.characters.get(id);
    if (!character) {
      throw new Error("Character not found");
    }
    const updated = { ...character, initiative };
    this.characters.set(id, updated);
    return updated;
  }

  async deleteCharacter(id: number): Promise<void> {
    if (!this.characters.delete(id)) {
      throw new Error("Character not found");
    }
  }

  async deleteAllCharacters(): Promise<void> {
    this.characters.clear();
  }

  // New tutorial content methods
  async getTutorialContent(): Promise<TutorialContent[]> {
    return Array.from(this.tutorialContent.values())
      .sort((a, b) => a.stepId - b.stepId);
  }

  async createTutorialContent(content: InsertTutorialContent): Promise<TutorialContent> {
    const id = this.currentTutorialId++;
    const now = new Date().toISOString();
    const tutorialContent: TutorialContent = {
      ...content,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.tutorialContent.set(id, tutorialContent);
    return tutorialContent;
  }

  async updateTutorialContent(id: number, content: Partial<InsertTutorialContent>): Promise<TutorialContent> {
    const existing = this.tutorialContent.get(id);
    if (!existing) {
      throw new Error("Tutorial content not found");
    }
    const updated = {
      ...existing,
      ...content,
      updatedAt: new Date().toISOString(),
    };
    this.tutorialContent.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();