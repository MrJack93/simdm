require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const prisma = require('./db');

// L3 Fix: Use async logger (Pino) instead of synchronous appendFileSync
const { log } = require('./utils/logger');

const authMiddleware = require('./middleware/auth');
const { cleanupExpiredTokens } = require('./jobs/cleanupTokens');

let authRoutes, sectionsRoutes, deviceRoutes, consumableRoutes, annualInventoryRoutes;
let auditLogsRoutes, maintenanceRoutes, incidentRoutes;
try {
  authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
  sectionsRoutes = require('./routes/sections');
  console.log('✅ Sections routes loaded');
  deviceRoutes = require('./routes/devices');
  console.log('✅ Device routes loaded');
  consumableRoutes = require('./routes/consumables');
  console.log('✅ Consumables routes loaded');
  annualInventoryRoutes = require('./routes/annualInventory');
  console.log('✅ Annual inventory routes loaded');
  auditLogsRoutes = require('./routes/auditLogs');
  console.log('✅ Audit logs routes loaded');
  maintenanceRoutes = require('./routes/maintenance');
  console.log('✅ Maintenance routes loaded');
  incidentRoutes = require('./routes/incidents');
  console.log('✅ Incidents routes loaded');
} catch (e) {
  console.error('❌ Error loading routes:', e.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
// L4 Fix: CORS origin from .env for flexible deployment
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// M3 Fix: Remove public /uploads serving — medical documents require authentication
// const uploadsDir = path.join(__dirname, '../uploads');
// app.use('/uploads', express.static(uploadsDir));

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

// L1 Fix: Standardized auth middleware application (all protected routes in index.js)
app.use('/api/auth', authRoutes); // Public - login/refresh
app.use('/api/sections', authMiddleware, sectionsRoutes);
app.use('/api/devices', authMiddleware, deviceRoutes);
app.use('/api/consumables', authMiddleware, consumableRoutes);
app.use('/api/annual-inventory', authMiddleware, annualInventoryRoutes);
app.use('/api/audit-logs', authMiddleware, auditLogsRoutes);
app.use('/api/maintenance', authMiddleware, maintenanceRoutes);
app.use('/api/incidents', authMiddleware, incidentRoutes);
// app.use('/api/documents', authMiddleware, documentRoutes);

app.use((err, req, res, next) => {
  log('ERROR HANDLER: ' + err.message);
  log(err.stack);
  res.status(500).json({ error: 'Eroare interna de server' });
});

// L2 Fix: Exit process on uncaught exception (let Docker/PM2 restart)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  log('FATAL: Exiting process due to uncaught exception');
  process.exit(1); // Exit so supervisor can restart
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

app.use((req, res) => {
  log(`404: No route matched for ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Ruta nu exista' });
});

if (require.main === module) {
  const server = app.listen(PORT, () => {
    log(`Server SIMDM pornit pe http://localhost:${PORT}`);
    log(`Health check: http://localhost:${PORT}/api/health`);

    // Daily cleanup of expired refresh tokens
    setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);
    log('Refresh token cleanup job started (daily)');
  });

  server.on('error', (err) => {
    log(`Server error: ${err.message}`);
    console.error('Server error:', err);
  });

  log('App setup complete, about to listen on port ' + PORT);
}

module.exports = app;
