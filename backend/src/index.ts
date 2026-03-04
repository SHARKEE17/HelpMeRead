import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AuthController } from './auth/auth.controller';
import { authenticateToken } from './auth/auth.middleware';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ORIGIN || 'http://localhost:5173',
  credentials: true, // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Database (Mock In-Memory for now to avoid build issues)
interface Todo {
  id: number;
  text: string;
  completed: number;
}
const todos: Todo[] = [];

// --- Auth Routes ---
app.post('/auth/signup', AuthController.registerPassword);
app.post('/auth/login', AuthController.loginPassword);

app.post('/auth/webauthn/register/options', AuthController.registerOptions);
app.post('/auth/webauthn/register/verify', AuthController.verifyRegister);
app.post('/auth/webauthn/login/options', AuthController.loginOptions);
app.post('/auth/webauthn/login/verify', AuthController.verifyLogin);

app.post('/auth/refresh', AuthController.refresh);
app.post('/auth/logout', AuthController.logout);
app.get('/auth/me', authenticateToken, AuthController.me);


// --- Todo Routes (Protected Example) ---
app.get('/todos', authenticateToken, (_req: Request, res: Response) => {
  res.json(todos);
});

app.post('/todos', authenticateToken, (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  const newTodo = { id: Date.now(), text, completed: 0 };
  todos.push(newTodo);
  return res.json(newTodo);
});

app.put('/todos/:id', authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const { completed } = req.body;
  const todo = todos.find(t => t.id === parseInt(id));
  if (todo) {
    todo.completed = completed ? 1 : 0;
    res.json({ message: 'Todo updated' });
  } else {
    res.status(404).json({ error: 'Todo not found' });
  }
});

app.delete('/todos/:id', authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = todos.findIndex(t => t.id === parseInt(id));
  if (index !== -1) {
    todos.splice(index, 1);
    res.json({ message: 'Todo deleted' });
  } else {
    res.status(404).json({ error: 'Todo not found' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
