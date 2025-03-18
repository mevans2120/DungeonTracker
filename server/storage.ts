import { type Character, type InsertCharacter } from "@shared/schema";

export interface IStorage {
  getCharacters(): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacterHp(id: number, currentHp: number): Promise<Character>;
  deleteCharacter(id: number): Promise<void>;
  deleteAllCharacters(): Promise<void>;
}

export class MemStorage implements IStorage {
  private characters: Map<number, Character>;
  private currentId: number;

  constructor() {
    this.characters = new Map();
    this.currentId = 1;
  }

  async getCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values())
      .sort((a, b) => b.initiative - a.initiative);
  }

  async createCharacter(insertChar: InsertCharacter): Promise<Character> {
    const id = this.currentId++;
    const character: Character = { ...insertChar, id };
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

  async deleteCharacter(id: number): Promise<void> {
    if (!this.characters.delete(id)) {
      throw new Error("Character not found");
    }
  }

  async deleteAllCharacters(): Promise<void> {
    this.characters.clear();
  }
}

export const storage = new MemStorage();
