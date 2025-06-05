import express from "express";
import { registerRoutes } from "../server/routes";
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
  await initializeRoutes();
  
  // Convert Vercel request to Express request format
  app(req as any, res as any);
} 