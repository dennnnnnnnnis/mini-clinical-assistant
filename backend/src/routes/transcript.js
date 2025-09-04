const transcriptService = require('../services/transcriptService');

async function transcriptRoutes(fastify, options) {
  // Process transcript to generate SOAP note and coding suggestions
  fastify.post('/process', async (request, reply) => {
    try {
      const { transcript } = request.body;

      if (!transcript || typeof transcript !== 'string') {
        reply.status(400).send({ error: 'Transcript is required' });
        return;
      }

      if (transcript.length > 5120) { // 5KB limit
        reply.status(400).send({ error: 'Transcript too large (max 5KB)' });
        return;
      }

      // Process the transcript
      const result = await transcriptService.processTranscript(transcript);

      return {
        success: true,
        ...result,
        processed_at: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error('Error processing transcript:', error);
      reply.status(500).send({ 
        error: 'Failed to process transcript',
        details: error.message
      });
    }
  });

  // Validate transcript content for safety
  fastify.post('/validate', async (request, reply) => {
    try {
      const { transcript } = request.body;

      if (!transcript) {
        reply.status(400).send({ error: 'Transcript is required' });
        return;
      }

      const validation = transcriptService.validateTranscript(transcript);

      return {
        success: true,
        validation,
        validated_at: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error('Error validating transcript:', error);
      reply.status(500).send({ 
        error: 'Failed to validate transcript' 
      });
    }
  });

  // Get processing statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      // This would typically come from a database tracking processing history
      return {
        total_processed: 0,
        avg_processing_time: '0s',
        common_diagnoses: [],
        safety_flags_triggered: 0
      };
    } catch (error) {
      fastify.log.error('Error fetching transcript stats:', error);
      reply.status(500).send({ error: 'Failed to fetch statistics' });
    }
  });
}

module.exports = transcriptRoutes;