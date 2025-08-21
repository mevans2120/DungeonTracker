import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { characters } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { url } = req;
  
  try {
    // Test endpoint
    if (url === '/api/simple' || url === '/api/simple/health') {
      return res.status(200).json({ 
        status: 'ok',
        database: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
      });
    }
    
    // Database test
    if (url === '/api/simple/db-test') {
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: 'DATABASE_URL not configured' });
      }
      
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const db = drizzle({ client: pool, schema: { characters } });
      
      try {
        const result = await db.select().from(characters).limit(1);
        return res.status(200).json({ 
          success: true,
          message: 'Database connection successful',
          rowCount: result.length
        });
      } catch (dbError: any) {
        return res.status(500).json({ 
          error: 'Database query failed',
          message: dbError.message
        });
      } finally {
        await pool.end();
      }
    }
    
    return res.status(404).json({ error: 'Not found' });
    
  } catch (error: any) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}