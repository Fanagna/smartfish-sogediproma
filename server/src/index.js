// ✅ NE CHARGER dotenv QUE SI ON EST EN LOCAL
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const { startCronJobs } = require('./services/cronService');
const { initSocketIO } = require('./services/socketService');

// ─── Validation des variables d'environnement critiques ───
const REQUIRED_ENV_VARS = [
  { key: 'DATABASE_URL', label: 'URL de connexion PostgreSQL' },
  { key: 'JWT_SECRET', label: 'Secret JWT pour les tokens' },
  { key: 'GEMINI_API_KEY', label: 'Clé API Google Gemini' },
];

const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v.key]);
if (missingVars.length > 0) {
  logger.error('❌ Variables d\'environnement manquantes:');
  missingVars.forEach(v => logger.error(`   - ${v.key} (${v.label})`));
  logger.error('Le serveur va démarrer mais certaines fonctionnalités seront indisponibles.');
}

const app = express();

// ✅ AJOUTE CETTE LIGNE POUR RENDER
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;

// ─── HTTP Server + Socket.io ───
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 25000,
  pingTimeout: 20000
});

// Initialize Socket.io with auth
initSocketIO(io);

// ─── Express Middleware ───
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Trop de requêtes depuis cette IP'
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(limiter);
app.use(morgan('combined'));
app.use(express.json());

// ✅ ROUTE RACINE (pour éviter le 404)
app.get('/', (req, res) => {
  res.json({
    message: '🚀 SMARTFISH API est en ligne !',
    status: 'OK',
    version: '1.0.0',
    environment: {
      node: process.env.NODE_ENV || 'development',
      hasDatabase: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      hasGemini: !!process.env.GEMINI_API_KEY
    },
    endpoints: {
      health: '/api/health',
      api: '/api'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SMARTFISH API is running' });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

server.listen(PORT, () => {
  logger.info(`🚀 Serveur SMARTFISH démarré sur le port ${PORT} (HTTP + WebSocket)`);
  startCronJobs();
});