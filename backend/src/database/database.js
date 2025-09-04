const Database = require('better-sqlite3');
const path = require('path');

// Create database file in the backend directory
const dbPath = path.join(__dirname, '..', '..', 'clinical_assistant.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize database tables
function initializeDatabase() {
  try {
    // Patients table
    db.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        gender TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        medical_record_number TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clinical notes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS clinical_notes (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        note_type TEXT DEFAULT 'general',
        chief_complaint TEXT,
        diagnosis TEXT,
        treatment_plan TEXT,
        icd_codes TEXT, -- JSON string of ICD codes
        cpt_codes TEXT, -- JSON string of CPT codes
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
      )
    `);

    // Medical codes reference table (for RAG)
    db.exec(`
      CREATE TABLE IF NOT EXISTS medical_codes (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        code_type TEXT NOT NULL, -- 'ICD10', 'CPT'
        description TEXT NOT NULL,
        category TEXT,
        keywords TEXT, -- searchable keywords
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sessions table for storing transcript processing history
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transcript TEXT NOT NULL,
        soap_note TEXT, -- JSON string of SOAP note
        coding_suggestions TEXT, -- JSON string of coding suggestions
        safety_flags TEXT, -- JSON string of safety flags
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_patient_mrn ON patients(medical_record_number);
      CREATE INDEX IF NOT EXISTS idx_notes_patient ON clinical_notes(patient_id);
      CREATE INDEX IF NOT EXISTS idx_notes_type ON clinical_notes(note_type);
      CREATE INDEX IF NOT EXISTS idx_codes_type ON medical_codes(code_type);
      CREATE INDEX IF NOT EXISTS idx_codes_keywords ON medical_codes(keywords);
      CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
    `);

    // Insert sample medical codes for demonstration
    insertSampleMedicalCodes();

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

function insertSampleMedicalCodes() {
  const insertCode = db.prepare(`
    INSERT OR IGNORE INTO medical_codes (id, code, code_type, description, category, keywords) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Sample ICD-10 codes
  const icdCodes = [
    { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings', category: 'Routine Health', keywords: 'physical exam, checkup, routine, wellness, preventive' },
    { code: 'I10', description: 'Essential (primary) hypertension', category: 'Cardiovascular', keywords: 'high blood pressure, hypertension, cardiovascular, heart' },
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine', keywords: 'diabetes, blood sugar, glucose, type 2, diabetes mellitus' },
    { code: 'M79.3', description: 'Panniculitis, unspecified', category: 'Musculoskeletal', keywords: 'inflammation, soft tissue, panniculitis' },
    { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', category: 'Respiratory', keywords: 'cold, upper respiratory, URI, infection, throat, nose' },
    { code: 'R50.9', description: 'Fever, unspecified', category: 'Symptoms', keywords: 'fever, temperature, pyrexia, elevated temperature' }
  ];

  // Sample CPT codes
  const cptCodes = [
    { code: '99213', description: 'Office outpatient visit 15 minutes', category: 'E&M', keywords: 'office visit, outpatient, evaluation, management, follow-up' },
    { code: '99214', description: 'Office outpatient visit 25 minutes', category: 'E&M', keywords: 'office visit, outpatient, evaluation, management, detailed' },
    { code: '36415', description: 'Collection of venous blood by venipuncture', category: 'Laboratory', keywords: 'blood draw, venipuncture, lab, collection, phlebotomy' },
    { code: '93000', description: 'Electrocardiogram, routine ECG with at least 12 leads', category: 'Diagnostic', keywords: 'ECG, EKG, electrocardiogram, heart rhythm, cardiac' },
    { code: '80053', description: 'Comprehensive metabolic panel', category: 'Laboratory', keywords: 'blood work, metabolic panel, chemistry, lab test, glucose' }
  ];

  const allCodes = [
    ...icdCodes.map(c => ({ ...c, code_type: 'ICD10' })),
    ...cptCodes.map(c => ({ ...c, code_type: 'CPT' }))
  ];

  const transaction = db.transaction(() => {
    allCodes.forEach(code => {
      const id = `${code.code_type}_${code.code}`;
      insertCode.run(id, code.code, code.code_type, code.description, code.category, code.keywords);
    });
  });

  try {
    transaction();
    console.log('✅ Sample medical codes inserted');
  } catch (error) {
    console.log('ℹ️  Sample codes already exist or error inserting:', error.message);
  }
}

// Initialize the database
initializeDatabase();

module.exports = db;