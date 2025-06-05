import express from "express";
import { registerRoutes } from "./routes";
import { type VercelRequest, type VercelResponse } from "@vercel/node";

// Create express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes
let routesRegistered = false;

async function initializeRoutes() {
  if (!routesRegistered) {
    await registerRoutes(app);
    routesRegistered = true;
  }
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initializeRoutes();
    
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