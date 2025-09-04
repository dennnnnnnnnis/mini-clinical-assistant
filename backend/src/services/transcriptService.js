const OpenAI = require('openai');
const db = require('../database/database');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class TranscriptService {
  constructor() {
    // Emergency keywords that trigger high-risk warnings
    this.emergencyKeywords = [
      'chest pain', 'suicidal', 'suicide', 'heart attack', 'stroke', 
      'seizure', 'unconscious', 'bleeding', 'overdose', 'difficulty breathing',
      'shortness of breath severe', 'allergic reaction', 'anaphylaxis',
      'severe pain', 'emergency', 'urgent', 'critical'
    ];

    // Medical claims that need to be softened
    this.absoluteClaims = [
      { absolute: 'will cure', cautious: 'may help treat' },
      { absolute: 'will heal', cautious: 'may aid healing' },
      { absolute: 'guaranteed', cautious: 'likely to' },
      { absolute: 'definitely will', cautious: 'may' },
      { absolute: 'always works', cautious: 'often helps' },
      { absolute: 'never fails', cautious: 'is typically effective' },
      { absolute: 'completely safe', cautious: 'generally well-tolerated' },
      { absolute: 'no side effects', cautious: 'minimal side effects expected' },
    ];
  }

  async processTranscript(transcript) {
    const startTime = Date.now();
    const decisionLog = [];
    const safetyFlags = this.validateTranscript(transcript);
    
    try {
      decisionLog.push({
        step: 'Input Validation',
        description: `Transcript received (${transcript.length} chars). Safety scan completed.`,
        timestamp: new Date().toISOString()
      });

      // Extract speaker-labeled content
      const extractedContent = this.extractContent(transcript);
      decisionLog.push({
        step: 'Content Extraction',
        description: `Extracted ${extractedContent.patientStatements.length} patient statements and ${extractedContent.doctorStatements.length} provider statements.`,
        timestamp: new Date().toISOString()
      });

      // Generate SOAP note
      const soapResult = await this.generateSOAPNote(transcript, extractedContent);
      decisionLog.push({
        step: 'SOAP Generation',
        description: 'Generated structured SOAP note with problem list extraction.',
        timestamp: new Date().toISOString()
      });

      // Generate coding suggestions
      const codingResult = await this.generateCodingSuggestions(soapResult.soapNote, extractedContent);
      decisionLog.push({
        step: 'Medical Coding',
        description: `Generated ${codingResult.suggestions.icd_codes.length} ICD-10 codes and billing recommendations.`,
        timestamp: new Date().toISOString()
      });

      // Apply safety modifications
      const processedResults = this.applySafetyModifications({
        soap_note: soapResult.soapNote,
        coding_suggestions: codingResult.suggestions,
        safety_flags: safetyFlags
      });

      decisionLog.push({
        step: 'Safety Processing',
        description: `Applied ${processedResults.modifications_made.length} safety modifications.`,
        timestamp: new Date().toISOString()
      });

      const processingTime = Date.now() - startTime;
      decisionLog.push({
        step: 'Processing Complete',
        description: `Total processing time: ${processingTime}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        soap_note: processedResults.soap_note,
        coding_suggestions: processedResults.coding_suggestions,
        safety_flags: safetyFlags,
        decision_log: decisionLog,
        prompts_used: {
          soap_prompt: soapResult.prompt,
          coding_prompt: codingResult.prompt
        },
        processing_time_ms: processingTime
      };

    } catch (error) {
      decisionLog.push({
        step: 'Error',
        description: `Processing failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  validateTranscript(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    const emergencyTermsFound = [];
    
    // Check for emergency keywords
    this.emergencyKeywords.forEach(keyword => {
      if (lowerTranscript.includes(keyword.toLowerCase())) {
        emergencyTermsFound.push(keyword);
      }
    });

    return {
      high_risk: emergencyTermsFound.length > 0,
      emergency_terms: emergencyTermsFound,
      modified_claims: []
    };
  }

  extractContent(transcript) {
    const lines = transcript.split('\n');
    const patientStatements = [];
    const doctorStatements = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.includes(':')) {
        const [speaker, ...content] = trimmedLine.split(':');
        const statement = content.join(':').trim();
        
        if (speaker.toLowerCase().includes('patient')) {
          patientStatements.push(statement);
        } else if (speaker.toLowerCase().includes('doctor') || speaker.toLowerCase().includes('provider')) {
          doctorStatements.push(statement);
        }
      }
    });

    return { patientStatements, doctorStatements };
  }

  async generateSOAPNote(transcript, extractedContent) {
    const prompt = `You are a medical scribe creating a SOAP note from a clinical transcript. 

IMPORTANT: Return your response in this exact JSON format:
{
  "subjective": "Patient's reported symptoms and history...",
  "objective": "Physical exam findings and vital signs...",
  "assessment": "Clinical assessment and diagnoses...",
  "plan": "Treatment plan and next steps...",
  "problem_list": [
    {
      "problem": "Primary concern or diagnosis",
      "rationale": "Brief 1-2 line explanation of why this is a problem"
    }
  ]
}

Transcript:
${transcript}

Generate a structured SOAP note. Extract key problems with brief rationales. Use professional medical language but avoid absolute claims.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a medical documentation assistant. Always return valid JSON in the requested format. Use cautious medical language and avoid definitive claims.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      
      try {
        const soapNote = JSON.parse(response);
        return { soapNote, prompt };
      } catch (parseError) {
        // Fallback parsing if JSON is not valid
        return {
          soapNote: {
            subjective: "Unable to parse structured response - please review original transcript",
            objective: "Physical examination details not clearly extracted",
            assessment: "Assessment requires manual review",
            plan: "Treatment plan needs clinical review",
            problem_list: [
              {
                problem: "Documentation parsing issue",
                rationale: "AI response could not be properly structured"
              }
            ]
          },
          prompt
        };
      }
    } catch (error) {
      throw new Error(`SOAP note generation failed: ${error.message}`);
    }
  }

  async generateCodingSuggestions(soapNote, extractedContent) {
    const prompt = `Based on this SOAP note, suggest appropriate medical codes.

SOAP Note:
Subjective: ${soapNote.subjective}
Assessment: ${soapNote.assessment}
Plan: ${soapNote.plan}

IMPORTANT: Return response in this exact JSON format:
{
  "icd_codes": [
    {
      "code": "ICD-10 code",
      "description": "Code description",
      "confidence": "low|medium|high",
      "relevance_score": 0.85
    }
  ],
  "billing_hint": {
    "type": "em_level",
    "suggestion": "99213 - Office Visit Level 3",
    "justification": "Detailed history, exam, and moderate complexity"
  },
  "cpt_codes": [
    {
      "code": "CPT code", 
      "description": "Procedure description",
      "justification": "Why this code applies",
      "confidence": "low|medium|high"
    }
  ]
}

Provide up to 3 ICD-10 codes ranked by relevance. Include E/M level suggestion or up to 3 CPT codes. Rate confidence as low/medium/high.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a medical coding specialist. Return valid JSON with appropriate ICD-10 and CPT codes based on clinical documentation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.2,
      });

      const response = completion.choices[0].message.content;
      
      try {
        const suggestions = JSON.parse(response);
        return { suggestions, prompt };
      } catch (parseError) {
        // Fallback coding suggestions
        return {
          suggestions: {
            icd_codes: [
              {
                code: "Z00.00",
                description: "Encounter for general adult medical examination without abnormal findings",
                confidence: "low",
                relevance_score: 0.5
              }
            ],
            billing_hint: {
              type: "em_level",
              suggestion: "99213 - Office Visit Level 3",
              justification: "Unable to determine complexity from transcript"
            },
            cpt_codes: []
          },
          prompt
        };
      }
    } catch (error) {
      throw new Error(`Coding suggestions generation failed: ${error.message}`);
    }
  }

  applySafetyModifications(results) {
    let modificationsMade = [];
    let { soap_note, coding_suggestions, safety_flags } = results;

    // Apply cautious language modifications to SOAP note
    const sections = ['subjective', 'objective', 'assessment', 'plan'];
    sections.forEach(section => {
      if (soap_note[section]) {
        let modifiedText = soap_note[section];
        
        this.absoluteClaims.forEach(claim => {
          const regex = new RegExp(claim.absolute, 'gi');
          if (regex.test(modifiedText)) {
            modifiedText = modifiedText.replace(regex, claim.cautious);
            modificationsMade.push(`Modified "${claim.absolute}" to "${claim.cautious}" in ${section}`);
            safety_flags.modified_claims.push(claim.absolute);
          }
        });
        
        soap_note[section] = modifiedText;
      }
    });

    // Apply modifications to problem list rationales
    if (soap_note.problem_list) {
      soap_note.problem_list.forEach(problem => {
        let modifiedRationale = problem.rationale;
        
        this.absoluteClaims.forEach(claim => {
          const regex = new RegExp(claim.absolute, 'gi');
          if (regex.test(modifiedRationale)) {
            modifiedRationale = modifiedRationale.replace(regex, claim.cautious);
            modificationsMade.push(`Modified "${claim.absolute}" to "${claim.cautious}" in problem rationale`);
            safety_flags.modified_claims.push(claim.absolute);
          }
        });
        
        problem.rationale = modifiedRationale;
      });
    }

    return {
      soap_note,
      coding_suggestions,
      safety_flags,
      modifications_made: modificationsMade
    };
  }

  // Enhanced search function for local medical codes (RAG-like functionality)
  async searchLocalCodes(query, codeType = null) {
    try {
      let searchQuery = `
        SELECT code, code_type, description, category, keywords,
        (
          CASE 
            WHEN code LIKE ? THEN 10
            WHEN description LIKE ? THEN 5
            WHEN keywords LIKE ? THEN 3
            ELSE 1
          END
        ) as relevance_score
        FROM medical_codes
        WHERE (
          code LIKE ? OR
          description LIKE ? OR
          keywords LIKE ?
        )
      `;
      
      const params = [];
      const searchPattern = `%${query}%`;
      
      // Add relevance scoring parameters
      params.push(searchPattern, searchPattern, searchPattern);
      // Add search parameters  
      params.push(searchPattern, searchPattern, searchPattern);
      
      if (codeType) {
        searchQuery += ' AND code_type = ?';
        params.push(codeType);
      }
      
      searchQuery += ' ORDER BY relevance_score DESC, code LIMIT 10';
      
      const stmt = db.prepare(searchQuery);
      const results = stmt.all(...params);
      
      return results;
    } catch (error) {
      console.error('Error searching local codes:', error);
      return [];
    }
  }
}

module.exports = new TranscriptService();