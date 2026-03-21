import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rulesRouter from './routes/rulesRoutes';
import processRouter from './routes/processRoutes';
import { errorHandler } from './middleware/errorHandler';

// Initialize environment variables before importing other modules
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// --- Middleware ---
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// --- Routes ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/rules',   rulesRouter);
app.use('/api/process', processRouter);

// --- Error Handling ---
// Note: Must be registered last to catch errors from all preceding routes.
app.use(errorHandler);

// --- Server Init ---
app.listen(PORT, () => {
  console.log(`[server] Running at http://localhost:${PORT}`);
});