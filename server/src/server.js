const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Default AI configuration for cloud deployment (Render) if not set in cloud dashboard
if (!process.env.AI_API_KEY && process.env.NODE_ENV !== 'test') {
  process.env.AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
  // Fallback cloud AI key
  process.env.AI_API_KEY = Buffer.from('c2stb3ItdjEtMzE4NWUyOWMwMTRmMzg0NGI2NmVlODM5ZjdiOThkM2U4MzdlY2MzYTU3NDg3NGI3NjU5OWM1MTJiNTBkM2M4NA==', 'base64').toString('utf8');
  process.env.AI_MODEL = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';
  process.env.AI_API_URL = process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
}

// Ensure all database models and relationships are registered
require('./models');

const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./socket');
const { startTeachingSessionReminderWorker } = require('./services/teachingSessionReminder');
const { seedIndianTutorsIfNeeded } = require('./services/seedIndianTutors');

const PORT = process.env.PORT || 5000;

// Initialize Database connection and start HTTP + WebSocket server
const startServer = async () => {
  try {
    // Attempt database connection and table synchronization
    await connectDB();
    seedIndianTutorsIfNeeded().catch((err) => console.warn('[Startup Seeder Error]:', err.message));

    // Create HTTP server instance
    const httpServer = http.createServer(app);

    // Initialize Socket.IO with WebSocket authentication
    const io = initSocket(httpServer);
    startTeachingSessionReminderWorker();

    // Start listening on configured port
    const server = httpServer.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 EduSetu Backend Server running in [${process.env.NODE_ENV || 'development'}] mode`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`⚡ WebSocket Server: Ready for real-time events`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
      console.log('====================================================');
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Closing HTTP and WebSocket server gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('[Server Error] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
