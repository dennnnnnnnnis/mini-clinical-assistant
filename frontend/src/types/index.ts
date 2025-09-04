// Patient types
export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  medical_record_number: string;
  created_at: string;
  updated_at: string;
  notes_count?: number;
  recent_notes?: ClinicalNote[];
}

// Clinical Note types
export interface ClinicalNote {
  id: string;
  patient_id: string;
  title: string;
  content: string;
  note_type: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  icd_codes: MedicalCode[];
  cpt_codes: MedicalCode[];
  created_at: string;
  updated_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    medical_record_number: string;
    date_of_birth?: string;
  };
}

// Medical Code types
export interface MedicalCode {
  id?: string;
  code: string;
  code_type: 'ICD10' | 'CPT';
  description: string;
  category?: string;
  keywords?: string;
  confidence?: number;
  relevance?: number;
}

// AI Assistance types
export interface NoteAssistance {
  raw_response: string;
  structured: {
    history?: string;
    assessment?: string;
    plan?: string;
    suggestions?: string;
    general?: string;
  };
  generated_at: string;
}

export interface CodingSuggestion {
  ai_suggestions: {
    icd_codes: Array<{
      code: string;
      description: string;
      confidence: number;
    }>;
    cpt_codes: Array<{
      code: string;
      description: string;
      confidence: number;
    }>;
    raw_response: string;
    generated_at: string;
  };
  enhanced_suggestions: {
    icd_codes: MedicalCode[];
    cpt_codes: MedicalCode[];
  };
  generated_at: string;
}

// Form types
export interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  medical_record_number?: string;
}

export interface NoteFormData {
  patient_id: string;
  title: string;
  content: string;
  note_type: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  icd_codes?: MedicalCode[];
  cpt_codes?: MedicalCode[];
}

// API Response types
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

// Search types
export interface SearchFilters {
  search?: string;
  patient_id?: string;
  note_type?: string;
  code_type?: 'ICD10' | 'CPT';
  category?: string;
  limit?: number;
  offset?: number;
}

// Statistics types
export interface CodingStats {
  stats: {
    by_type: Array<{
      code_type: string;
      count: number;
    }>;
    top_categories: Array<{
      category: string;
      count: number;
    }>;
    total_codes: number;
    usage: {
      notes_with_codes: number;
      avg_icd_per_note: number;
      avg_cpt_per_note: number;
    };
  };
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  problem_list: Array<{
    problem: string;
    rationale: string;
  }>;
}

export interface CodingSuggestions {
  icd_codes: Array<{
    code: string;
    description: string;
    confidence: 'low' | 'medium' | 'high';
    relevance_score: number;
  }>;
  billing_hint: {
    type: 'em_level' | 'cpt_codes';
    suggestion: string;
    justification: string;
  };
  cpt_codes?: Array<{
    code: string;
    description: string;
    justification: string;
    confidence: 'low' | 'medium' | 'high';
  }>;
}

export interface DecisionLog {
  step: string;
  description: string;
  timestamp: string;
}

export interface ProcessingResult {
  soap_note: SOAPNote;
  coding_suggestions: CodingSuggestions;
  decision_log: DecisionLog[];
  prompts_used: {
    soap_prompt: string;
    coding_prompt: string;
  };
  safety_flags: {
    high_risk: boolean;
    emergency_terms: string[];
    modified_claims: string[];
  };
}

export interface Session {
  id: number;
  transcript: string;
  soap_note: string | null;
  coding_suggestions: string | null;
  safety_flags: string | null;
  created_at: string;
}

export interface ParsedSoapNote {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface ParsedCodingData {
  icd_codes?: Array<{ code: string; description: string; confidence: string }>;
  cpt_codes?: Array<{ code: string; description: string; confidence: string }>;
  e_m_level?: { code: string; description: string; level: string };
}

export interface ParsedSafetyFlags {
  hasRisks?: boolean;
  high_risk?: boolean;
  flags?: string[];
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'loading' | 'custom';

// Note types enum
export const NOTE_TYPES = {
  GENERAL: 'general',
  CONSULTATION: 'consultation',
  PROGRESS: 'progress',
  DISCHARGE: 'discharge',
  OPERATIVE: 'operative',
  EMERGENCY: 'emergency',
} as const;

export type NoteType = typeof NOTE_TYPES[keyof typeof NOTE_TYPES];