import type { VercelRequest, VercelResponse } from "@vercel/node";

// Simple test without any imports
export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const testImport = require('./_shared/schema');
    res.status(200).json({
      status: 'ok',
      message: 'Successfully imported schema',
      hasCharacters: !!testImport.characters,
      keys: Object.keys(testImport).slice(0, 5)
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Import failed',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
  }
}