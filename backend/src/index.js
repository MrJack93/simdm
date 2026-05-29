require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const prisma = require('./db');
const fs = require('fs');
const LOG_FILE = '/tmp/backend.log';

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  console.log(line.trim());
  fs.appendFileSync(LOG_FILE, line, { flag: 'a' });
}

const authMiddleware = require('./middleware/auth');

let authRoutes, sectionsRoutes;
try {
  authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
  sectionsRoutes = require('./routes/sections');
  console.log('✅ Sections routes loaded');
} catch (e) {
  console.error('❌ Error loading routes:', e.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Debug middleware
app.use((req, res, next) => {
  log(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
    });
  } catch (error) {
    log('Database health check failed: ' + error.message);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/sections', authMiddleware, sectionsRoutes);

// Viitoarele rute se adaugă în fazele 2-8:
// app.use('/api/devices',     authMiddleware, deviceRoutes);
// app.use('/api/maintenance', authMiddleware, maintenanceRoutes);
// app.use('/api/incidents',   authMiddleware, incidentRoutes);
// app.use('/api/documents',   authMiddleware, documentRoutes);

app.use((err, req, res, next) => {
  log('ERROR HANDLER: ' + err.message);
  log(err.stack);
  res.status(500).json({ error: 'Eroare interna de server' });
});

// Catch all unhandled errors
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

app.use((req, res) => {
  log(`404: No route matched for ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Ruta nu exista' });
});

const server = app.listen(PORT, () => {
  log(`Server SIMDM pornit pe http://localhost:${PORT}`);
  log(`Health check: http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
  log(`Server error: ${err.message}`);
  console.error('Server error:', err);
});

log('App setup complete, about to listen on port ' + PORT);
