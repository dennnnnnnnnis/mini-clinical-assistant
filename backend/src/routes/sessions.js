const db = require('../database/database');

async function sessionRoutes(fastify, options) {
  // Get all sessions
  fastify.get('/', async (request, reply) => {
    try {
      const stmt = db.prepare(`
        SELECT * FROM sessions 
        ORDER BY created_at DESC
      `);
      
      const sessions = stmt.all();
      return { sessions };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch sessions',
        message: error.message
      });
    }
  });

  // Get a specific session by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
      const session = stmt.get(id);
      
      if (!session) {
        return reply.status(404).send({
          error: 'Session not found'
        });
      }
      
      return { session };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch session',
        message: error.message
      });
    }
  });

  // Create a new session
  fastify.post('/', async (request, reply) => {
    try {
      const { transcript, soapNote, codingSuggestions, safetyFlags } = request.body;
      
      if (!transcript) {
        return reply.status(400).send({
          error: 'Transcript is required'
        });
      }

      const stmt = db.prepare(`
        INSERT INTO sessions (transcript, soap_note, coding_suggestions, safety_flags, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);
      
      const result = stmt.run(
        transcript,
        soapNote ? JSON.stringify(soapNote) : null,
        codingSuggestions ? JSON.stringify(codingSuggestions) : null,
        safetyFlags ? JSON.stringify(safetyFlags) : null
      );
      
      const newSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
      
      return { 
        success: true,
        session: newSession
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to create session',
        message: error.message
      });
    }
  });

  // Delete a session
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        return reply.status(404).send({
          error: 'Session not found'
        });
      }
      
      return { 
        success: true,
        message: 'Session deleted successfully'
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to delete session',
        message: error.message
      });
    }
  });
}

module.exports = sessionRoutes;
