const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trip');
const roomRoutes = require('./routes/room');

const app = express();

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Trip Planner API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/rooms', roomRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');

    const http = require('http');
    const { Server } = require('socket.io');
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: [
          process.env.CLIENT_URL || 'http://localhost:3000',
          'http://localhost:3000',
          'http://127.0.0.1:3000',
        ],
        credentials: true,
      },
    });

    const initSocket = require('./socketHandler');
    initSocket(io);

    server.listen(PORT, () => {
      const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
      const providerKeyNames = {
        gemini: 'GEMINI_API_KEY',
        grok: 'GROK_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
      };
      const selectedProvider = providerKeyNames[provider] ? provider : 'gemini';
      const selectedKeyName = providerKeyNames[selectedProvider];

      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`LLM provider: ${selectedProvider} (${selectedKeyName} ${process.env[selectedKeyName] ? 'configured' : 'missing'})`);
      console.log(`Provider keys available: Gemini=${process.env.GEMINI_API_KEY ? 'yes' : 'no'}, Grok=${process.env.GROK_API_KEY ? 'yes' : 'no'}, Anthropic=${process.env.ANTHROPIC_API_KEY ? 'yes' : 'no'}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    console.log('Full error:', err.response?.data || err.message);
    process.exit(1);
  });
