// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require("./routes/authRoutes.js");
const diaryRoutes = require("./routes/diaryRoutes.js");
const errorHandler = require("./utils/errorHandler.js");
const { apiLimiter } = require("./utils/rateLimit.js");

const app = express();
const PORT = process.env.PORT || 5001;
const isProd = process.env.NODE_ENV === 'production';

// Fail fast in production if the JWT secret wasn't configured — tokens would be
// trivially forgeable otherwise.
if (isProd && !process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is required in production. Set it and restart.');
  process.exit(1);
}

// Behind a single reverse proxy (e.g. when hosted on a subdomain) so
// rate-limiting sees the real client IP, not the proxy's.
app.set('trust proxy', 1);

// Security headers. A Content-Security-Policy that allows what the app actually
// uses: its own assets, Google Fonts, inline style attributes (mood colours),
// and data: images.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS. In production the frontend is served from the same origin as the API, so
// this rarely fires; set CLIENT_ORIGIN (comma-separated) if you host them apart.
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5001'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '32kb' }));            // cap request body size
app.use(express.urlencoded({ extended: true, limit: '32kb' }));
app.use(morgan(isProd ? 'combined' : 'dev'));

// Rate limiting: a general ceiling on the whole API (stricter per-route limiters
// live in the route files for auth and the Gemini-backed endpoints).
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', diaryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Serve the built React app in production (client/dist). In dev the Vite server
// runs separately on port 5173 and proxies /api here, so this is a no-op then.
const clientDist = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Send index.html for any non-API route so client-side routing works.
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});
