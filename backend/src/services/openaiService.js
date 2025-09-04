const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class OpenAIService {
  /**
   * Generate clinical note suggestions based on input
   * @param {string} chiefComplaint - Patient's main concern
   * @param {string} symptoms - Detailed symptoms
   * @param {string} context - Additional context
   * @returns {Promise<Object>} Generated note suggestions
   */
  async generateNoteAssistance(chiefComplaint, symptoms = '', context = '') {
    try {
      const prompt = this.buildClinicalNotePrompt(chiefComplaint, symptoms, context);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful clinical assistant that helps healthcare providers with clinical documentation. 
            Provide structured, professional medical notes following standard clinical documentation practices. 
            Always include appropriate disclaimers about the need for clinical judgment and verification.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Low temperature for more consistent medical content
      });

      const response = completion.choices[0].message.content;
      return this.parseNoteResponse(response);
    } catch (error) {
      console.error('OpenAI Note Generation Error:', error);
      throw new Error('Failed to generate note assistance');
    }
  }

  /**
   * Suggest medical codes based on clinical content
   * @param {string} diagnosis - Primary diagnosis
   * @param {string} procedures - Procedures performed
   * @param {string} symptoms - Patient symptoms
   * @returns {Promise<Object>} Suggested medical codes
   */
  async suggestMedicalCodes(diagnosis, procedures = '', symptoms = '') {
    try {
      const prompt = this.buildCodingPrompt(diagnosis, procedures, symptoms);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a medical coding assistant. Suggest appropriate ICD-10 and CPT codes based on clinical information.
            Format your response as JSON with 'icd_codes' and 'cpt_codes' arrays.
            Each code should include 'code', 'description', and 'confidence' (0-1).
            Always add disclaimers about verification requirements.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.2, // Very low temperature for coding accuracy
      });

      const response = completion.choices[0].message.content;
      return this.parseCodingResponse(response);
    } catch (error) {
      console.error('OpenAI Coding Suggestion Error:', error);
      throw new Error('Failed to generate coding suggestions');
    }
  }

  /**
   * Improve or expand existing clinical notes
   * @param {string} existingNote - Current note content
   * @param {string} improvement - What to improve or add
   * @returns {Promise<string>} Improved note
   */
  async improveNote(existingNote, improvement) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a clinical documentation assistant. Help improve clinical notes while maintaining professional medical language and structure.'
          },
          {
            role: 'user',
            content: `Please improve the following clinical note by ${improvement}:

            Current Note:
            ${existingNote}

            Provide an improved version that maintains clinical accuracy and professionalism.`
          }
        ],
        max_tokens: 1200,
        temperature: 0.3,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Note Improvement Error:', error);
      throw new Error('Failed to improve note');
    }
  }

  /**
   * Build prompt for clinical note generation
   */
  buildClinicalNotePrompt(chiefComplaint, symptoms, context) {
    return `Generate a structured clinical note based on the following information:

Chief Complaint: ${chiefComplaint}
${symptoms ? `Symptoms: ${symptoms}` : ''}
${context ? `Additional Context: ${context}` : ''}

Please provide a structured note with the following sections:
- History of Present Illness
- Assessment
- Plan
- Suggested next steps

Keep the language professional and medically appropriate.`;
  }

  /**
   * Build prompt for medical coding suggestions
   */
  buildCodingPrompt(diagnosis, procedures, symptoms) {
    return `Based on the following clinical information, suggest appropriate medical codes:

Primary Diagnosis: ${diagnosis}
${procedures ? `Procedures: ${procedures}` : ''}
${symptoms ? `Symptoms: ${symptoms}` : ''}

Please suggest:
1. Relevant ICD-10 codes for diagnoses
2. Relevant CPT codes for procedures/visits

Format as JSON and include confidence levels.`;
  }

  /**
   * Parse clinical note response into structured format
   */
  parseNoteResponse(response) {
    // Simple parsing - in production, you might want more sophisticated parsing
    const sections = {
      history: '',
      assessment: '',
      plan: '',
      suggestions: ''
    };

    try {
      const lines = response.split('\n');
      let currentSection = '';

      for (const line of lines) {
        if (line.toLowerCase().includes('history of present illness') || line.toLowerCase().includes('history')) {
          currentSection = 'history';
        } else if (line.toLowerCase().includes('assessment')) {
          currentSection = 'assessment';
        } else if (line.toLowerCase().includes('plan')) {
          currentSection = 'plan';
        } else if (line.toLowerCase().includes('suggestion') || line.toLowerCase().includes('next steps')) {
          currentSection = 'suggestions';
        } else if (line.trim() && currentSection) {
          sections[currentSection] += line + '\n';
        }
      }

      return {
        raw_response: response,
        structured: sections,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        raw_response: response,
        structured: { general: response },
        generated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Parse coding response into structured format
   */
  parseCodingResponse(response) {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          raw_response: response,
          generated_at: new Date().toISOString()
        };
      }
      
      // Fallback parsing
      return {
        icd_codes: [],
        cpt_codes: [],
        raw_response: response,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing coding response:', error);
      return {
        icd_codes: [],
        cpt_codes: [],
        raw_response: response,
        generated_at: new Date().toISOString(),
        error: 'Failed to parse response'
      };
    }
  }
}

module.exports = new OpenAIService();