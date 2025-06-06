# 🐉 Dungeon Tracker

A modern, full-stack D&D combat tracker built for tabletop gaming sessions. Track initiative order, manage character HP, and keep your combat encounters flowing smoothly.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

## ✨ Features

### 🎲 Combat Management
- **Initiative Tracking**: Automatically sorts characters by initiative order
- **HP Management**: Real-time hit point tracking with damage/healing
- **Turn Navigation**: Keyboard shortcuts for quick turn advancement
- **Character Types**: Separate tracking for Player Characters and NPCs

### 🎮 User Experience
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Interactive Tutorial**: Built-in guide for new users
- **Real-time Updates**: Instant synchronization across all clients
- **Keyboard Navigation**: Arrow keys for quick turn management

### 🛠️ Technical Features
- **Full-stack TypeScript**: Type-safe from database to UI
- **Real-time Analytics**: Vercel Analytics integration
- **Database Persistence**: PostgreSQL with Drizzle ORM
- **Modern React**: Hooks, Context, and Query management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/DungeonTracker.git
   cd DungeonTracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   echo "DATABASE_URL=your_postgresql_connection_string" > .env
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📋 Usage

### Adding Characters
1. Click **"Add to Combat"** button
2. Fill in character details:
   - **Name**: Character identifier
   - **Initiative**: Roll result (1-30)
   - **Current HP**: Starting hit points
   - **Max HP**: Optional maximum HP
   - **NPC**: Toggle for non-player characters

### Managing Combat
- **Turn Order**: Characters automatically sorted by initiative
- **HP Tracking**: Click HP values to modify
- **Initiative Changes**: Edit initiative mid-combat
- **Character Actions**: Edit, remove, or select characters
- **Keyboard Shortcuts**: 
  - `↑/↓` arrows: Navigate turns
  - `Tab`: Next turn

### Viewing Options
- **Sort by Initiative**: Pure initiative order
- **Group by Type**: Separate PC and NPC sections
- **Current Turn**: Highlighted active character

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Wouter** for routing
- **TanStack Query** for state management
- **React Hook Form** for form handling

### Backend
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations
- **Zod** for schema validation
- **PostgreSQL** database (Neon)

### Deployment & Analytics
- **Vercel** for hosting and deployment
- **Vercel Analytics** for user tracking
- **Environment-based configuration**

## 📁 Project Structure

```
DungeonTracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and config
│   │   └── assets/         # Static assets
├── server/                 # Express backend (development)
├── api/                    # Vercel serverless functions
├── shared/                 # Shared TypeScript schemas
├── dist/                   # Built frontend assets  
└── package.json
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Push database schema changes
```

### Database Schema
```sql
-- Characters table
CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  initiative INTEGER NOT NULL,
  current_hp INTEGER NOT NULL,
  max_hp INTEGER,
  is_npc BOOLEAN NOT NULL DEFAULT false
);

-- Tutorial content table
CREATE TABLE tutorial_content (
  id SERIAL PRIMARY KEY,
  step_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content JSON NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🚦 API Endpoints

### Characters
- `GET /api/characters` - List all characters
- `POST /api/characters` - Create new character
- `PATCH /api/characters/:id` - Update character
- `PATCH /api/characters/:id/hp` - Update HP
- `PATCH /api/characters/:id/initiative` - Update initiative
- `DELETE /api/characters/:id` - Remove character
- `DELETE /api/characters` - Reset combat (remove all)

### Tutorial
- `GET /api/tutorial` - Get tutorial content
- `POST /api/tutorial` - Create tutorial step
- `PATCH /api/tutorial/:id` - Update tutorial step

## 🌍 Deployment

### Vercel (Recommended)
1. Fork this repository
2. Connect to Vercel
3. Add environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
4. Deploy!

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] Mobile responsive design
- [ ] Spell slot tracking
- [ ] Condition/status effects
- [ ] Campaign management
- [ ] Export/import encounters
- [ ] Audio cues for turn changes
- [ ] Dice rolling integration

## 🐛 Known Issues

- Desktop-optimized (mobile support in development)
- Initiative ties require manual resolution

## 📞 Support

If you encounter any issues or have questions:
1. Check the built-in tutorial (help icon)
2. Review the [Issues](https://github.com/yourusername/DungeonTracker/issues) page
3. Create a new issue with detailed information

---

**Built with ❤️ for the D&D community** 