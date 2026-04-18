import express from 'express';
console.log('--- SERVER INITIALIZING ---');
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'bible-api-secret-123';
const db = new Database('bible_qa.db');

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NULL,
    session_id TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER,
    role TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    answer TEXT,
    source TEXT,
    confidence REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bible_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book TEXT,
    chapter INTEGER,
    verse INTEGER,
    text TEXT
  );
`);

// Simple RAG Logic Helper
function findRelevantVerses(query: string) {
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 3);
    if (keywords.length === 0) return [];
    
    const conditions = keywords.map(() => 'text LIKE ?').join(' OR ');
    const params = keywords.map(word => `%${word}%`);
    
    return db.prepare(`SELECT * FROM bible_verses WHERE ${conditions} LIMIT 5`).all(...params);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  // 1. Authentication APIs
  app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
      const info = stmt.run(username, hashedPassword);
      res.json({ id: info.lastInsertRowid, username });
    } catch (err) {
      res.status(400).json({ error: 'Username already exists' });
    }
  });

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username } });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
  });

  // 2. Chat Persistence & Context APIs
  app.get('/api/chat-context', async (req, res) => {
    const { question, session_id } = req.query;
    const authHeader = req.headers['authorization'];
    let userId = null;

    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {}
    }

    if (!question) return res.status(400).json({ error: 'Question is required' });

    // RAG: Find verses
    const relevantVerses: any = findRelevantVerses(question as string);
    const context = relevantVerses.map((v: any) => `${v.book} ${v.chapter}:${v.verse} - ${v.text}`).join('\n');

    // Conversation Memory
    let conversation: any;
    if (userId) {
        conversation = db.prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
    } else if (session_id) {
        conversation = db.prepare('SELECT * FROM conversations WHERE session_id = ? ORDER BY id DESC LIMIT 1').get(session_id);
    }

    if (!conversation) {
        const info = db.prepare('INSERT INTO conversations (user_id, session_id) VALUES (?, ?)').run(userId, session_id);
        conversation = { id: info.lastInsertRowid };
    }

    const history = db.prepare('SELECT role, message as text FROM messages WHERE conversation_id = ? ORDER BY id ASC LIMIT 20').all(conversation.id);

    res.json({ context, history, conversation_id: conversation.id });
  });

  app.post('/api/save-chat', async (req, res) => {
    const { conversation_id, question, answer, source, confidence } = req.body;
    
    try {
      // Store Messages
      db.prepare('INSERT INTO messages (conversation_id, role, message) VALUES (?, ?, ?)').run(conversation_id, 'user', question);
      db.prepare('INSERT INTO messages (conversation_id, role, message) VALUES (?, ?, ?)').run(conversation_id, 'assistant', answer);

      // Log the request
      db.prepare('INSERT INTO logs (question, answer, source, confidence) VALUES (?, ?, ?, ?)').run(question, answer, source, confidence);

      res.json({ status: 'ok' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save chat' });
    }
  });

  // 3. History APIs
  app.get('/api/history', (req, res) => {
    const { session_id } = req.query;
    const authHeader = req.headers['authorization'];
    let userId = null;

    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {}
    }

    let conversation: any;
    if (userId) {
        conversation = db.prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
    } else if (session_id) {
        conversation = db.prepare('SELECT * FROM conversations WHERE session_id = ? ORDER BY id DESC LIMIT 1').get(session_id);
    }

    if (!conversation) return res.json({ history: [] });

    const messages = db.prepare('SELECT role, message as text, timestamp FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(conversation.id);
    res.json({ history: messages });
  });

  // 4. Seeding API (Internal helper)
  app.post('/api/seed-bible', (req, res) => {
    const { verses } = req.body; // Array of { book, chapter, verse, text }
    const insert = db.prepare('INSERT INTO bible_verses (book, chapter, verse, text) VALUES (?, ?, ?, ?)');
    const insertMany = db.transaction((data) => {
      for (const v of data) insert.run(v.book, v.chapter, v.verse, v.text);
    });
    insertMany(verses);
    res.json({ message: 'Seeded successfully' });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('--- SERVER STARTUP SUCCESS ---');
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log('Mode:', process.env.NODE_ENV || 'development');
  });
}

startServer();
