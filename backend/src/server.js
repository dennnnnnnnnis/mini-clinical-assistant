const fastify = require('fastify')({ 
  logger: true 
});

// Import environment variables
require('dotenv').config();

// Register CORS
fastify.register(require('@fastify/cors'), {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
});

// Import database initialization
const db = require('./database/database');

// // Import services
// const openaiService = require('./services/openaiService');

// Import routes
const patientRoutes = require('./routes/patients');
const transcriptRoutes = require('./routes/transcript');
const sessionRoutes = require('./routes/sessions');

// Register routes
fastify.register(patientRoutes, { prefix: '/api/patients' });
fastify.register(transcriptRoutes, { prefix: '/api/transcript' });
fastify.register(sessionRoutes, { prefix: '/api/sessions' });

// Health check route
fastify.get('/api/health', async (request, reply) => {
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
});

// Root route
fastify.get('/', async (request, reply) => {
  return { 
    message: 'Mini Clinical Assistant API',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'GET /api/patients',
      'POST /api/patients',
      'POST /api/transcript/process',
      'GET /api/sessions',
      'POST /api/sessions'
    ]
  };
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  if (error.statusCode) {
    reply.status(error.statusCode).send({
      error: error.message,
      statusCode: error.statusCode
    });
  } else {
    reply.status(500).send({
      error: 'Internal Server Error',
      statusCode: 500
    });
  }
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(`📚 API Documentation available at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('👋 Gracefully shutting down...');
  await fastify.close();
  process.exit(0);
});

start();