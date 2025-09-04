import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ProcessingResult } from '@/types';

const TranscriptProcessor: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [complianceAcknowledged, setComplianceAcknowledged] = useState(false);

  // Load session data on component mount
  useEffect(() => {
    const loadLastSession = async () => {
      try {
        // First, try to load from localStorage
        const savedSession = localStorage.getItem('currentTranscriptSession');
        if (savedSession) {
          const session = JSON.parse(savedSession);
          setTranscript(session.transcript || '');
          setResult(session.result || null);
          setComplianceAcknowledged(session.complianceAcknowledged || false);
          setSafetyAcknowledged(session.safetyAcknowledged || false);
          return;
        }

        // If no localStorage data, try to load the most recent session from backend
        const apiUrl = '/api';
        const response = await fetch(`${apiUrl}/sessions`);
        if (response.ok) {
          const data = await response.json();
          const sessions = data.sessions || [];
          if (sessions.length > 0) {
            const lastSession = sessions[0]; // Sessions are ordered by created_at DESC
            setTranscript(lastSession.transcript || '');
            
            if (lastSession.soap_note || lastSession.coding_suggestions) {
              const result: ProcessingResult = {
                soap_note: lastSession.soap_note ? JSON.parse(lastSession.soap_note) : null,
                coding_suggestions: lastSession.coding_suggestions ? JSON.parse(lastSession.coding_suggestions) : null,
                safety_flags: lastSession.safety_flags ? JSON.parse(lastSession.safety_flags) : { high_risk: false, emergency_terms: [], modified_claims: [] },
                decision_log: [], // Empty decision log for restored sessions
                prompts_used: { soap_prompt: '', coding_prompt: '' } // Empty prompts for restored sessions
              };
              setResult(result);
            }
          }
        }
      } catch (error) {
        console.error('Error loading last session:', error);
      }
    };

    loadLastSession();
  }, []);

  // Save current session data to localStorage whenever state changes
  useEffect(() => {
    const sessionData = {
      transcript,
      result,
      complianceAcknowledged,
      safetyAcknowledged,
    };
    localStorage.setItem('currentTranscriptSession', JSON.stringify(sessionData));
  }, [transcript, result, complianceAcknowledged, safetyAcknowledged]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain') {
      toast.error('Please upload a .txt file');
      return;
    }

    if (file.size > 5 * 1024) { // 5KB limit
      toast.error('File size must be ≤ 5KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTranscript(content);
      setFileName(file.name);
      toast.success('Transcript uploaded successfully');
    };
    reader.readAsText(file);
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast.error('Please enter or upload a transcript');
      return;
    }

    if (!complianceAcknowledged) {
      toast.error('Please acknowledge the compliance notice');
      return;
    }

    try {
      setProcessing(true);
      
      // Call enhanced API endpoint for transcript processing
      const apiUrl = '/api';
      const response = await fetch(`${apiUrl}/transcript/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process transcript');
      }

      const processingResult = await response.json();
      setResult(processingResult);

      // Save the session to the database
      try {
        await fetch(`${apiUrl}/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript: transcript.trim(),
            soapNote: processingResult.soap_note,
            codingSuggestions: processingResult.coding_suggestions,
            safetyFlags: processingResult.safety_flags,
          }),
        });
        console.log('Session saved successfully');
      } catch (sessionError) {
        console.error('Failed to save session:', sessionError);
        // Don't show error to user as this is a background operation
      }

      // If high-risk content detected, require additional acknowledgment
      if (processingResult.safety_flags.high_risk && !safetyAcknowledged) {
        toast.error('High-risk content detected. Please review safety notice.');
      }
    } catch (error) {
      console.error('Error processing transcript:', error);
      toast.error('Failed to process transcript');
    } finally {
      setProcessing(false);
    }
  };

  const formatTranscript = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.includes(':')) {
        const [speaker, ...content] = trimmedLine.split(':');
        return (
          <div key={index} className="mb-2">
            <span className="font-semibold text-medical-600">{speaker.trim()}:</span>
            <span className="ml-2 text-gray-700">{content.join(':').trim()}</span>
          </div>
        );
      }
      return (
        <div key={index} className="mb-2 text-gray-700">
          {trimmedLine}
        </div>
      );
    });
  };

  const getConfidenceBadge = (confidence: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-green-100 text-green-800',
    };
    return `badge ${colors[confidence]}`;
  };

  const clearTranscript = () => {
    setTranscript('');
    setFileName('');
    setResult(null);
    setSafetyAcknowledged(false);
    setComplianceAcknowledged(false);
    localStorage.removeItem('currentTranscriptSession');
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyTranscript = () => {
    if (transcript) {
      copyToClipboard(transcript, 'Transcript');
    }
  };

  const copySoapSection = (section: string, content: string) => {
    const formattedContent = `${section.toUpperCase()}:\n${content}`;
    copyToClipboard(formattedContent, section);
  };

  const copyAllSoap = () => {
    if (result?.soap_note) {
      const soapText = Object.entries(result.soap_note)
        .map(([key, value]) => `${key.toUpperCase()}:\n${value}`)
        .join('\n\n');
      copyToClipboard(soapText, 'SOAP Note');
    }
  };

  const copyCodingSuggestions = () => {
    if (result?.coding_suggestions) {
      const codingText = [
        'ICD-10 CODES:',
        ...(result.coding_suggestions.icd_codes?.map(code => 
          `${code.code} - ${code.description} (${code.confidence})`
        ) || []),
        '',
        'CPT CODES:',
        ...(result.coding_suggestions.cpt_codes?.map(code => 
          `${code.code} - ${code.description} (${code.confidence})`
        ) || []),
        ...(result.coding_suggestions.billing_hint ? [
          '',
          'BILLING HINT:',
          `${result.coding_suggestions.billing_hint.type.toUpperCase()}: ${result.coding_suggestions.billing_hint.suggestion}`,
          `Justification: ${result.coding_suggestions.billing_hint.justification}`
        ] : [])
      ].join('\n');
      copyToClipboard(codingText, 'Coding Suggestions');
    }
  };

  const exportResultAsJson = () => {
    if (!result) {
      toast.error('No result to export');
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      original_transcript: transcript,
      soap_note: result.soap_note,
      coding_suggestions: result.coding_suggestions,
      safety_flags: result.safety_flags,
      decision_log: result.decision_log,
      prompts_used: result.prompts_used
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `clinical-transcript-result-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    toast.success('Result exported as JSON file!');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Clinical Transcript Processor
        </h1>
        <p className="text-gray-600">
          Upload or paste consultation transcripts to generate SOAP notes and coding suggestions
        </p>
      </div>

      {/* Compliance Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              Important: Draft Only - Clinical Review Required
            </h3>
            <p className="text-sm text-red-700 mb-3">
              This is not a medical device and may be inaccurate. All generated content is draft only 
              and requires review by a qualified clinician before use in patient care.
            </p>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={complianceAcknowledged}
                onChange={(e) => setComplianceAcknowledged(e.target.checked)}
                className="rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-red-800">
                I understand this is draft only and requires clinical review
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                1. Transcript Input
              </h2>
              {transcript && (
                <button
                  onClick={copyTranscript}
                  className="inline-flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                  title="Copy transcript"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </button>
              )}
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Transcript File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <div className="text-sm text-gray-600 mb-2">
                  Upload a .txt file (max 5KB)
                </div>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="transcript-upload"
                />
                <label
                  htmlFor="transcript-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Choose File
                </label>
                {fileName && (
                  <div className="mt-2 text-sm text-green-600">
                    📄 {fileName}
                  </div>
                )}
              </div>
            </div>

            {/* Text Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Or Paste Transcript
                </label>
                {transcript && (
                  <button
                    onClick={clearTranscript}
                    className="text-sm text-red-600 hover:text-red-800 flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Doctor: Hi, what brings you in today?&#10;Patient: I've been having..."
                className="w-full h-64 p-3 border border-gray-300 rounded-md text-sm font-mono"
              />
              <div className="mt-2 text-sm text-gray-500">
                {transcript.length} characters ({Math.ceil(transcript.length / 1024)} KB)
              </div>
            </div>

            {/* Process Button */}
            <div className="pt-4">
              <button
                onClick={processTranscript}
                disabled={!transcript.trim() || processing || !complianceAcknowledged}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-medical-600 hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate SOAP Note & Coding
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Formatted Transcript Preview */}
          {transcript && (
            <div className="card">
              <h3 className="text-md font-medium text-gray-900 mb-3">
                Transcript Preview
              </h3>
              <div className="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto text-sm">
                {formatTranscript(transcript)}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result && (
            <>
              {/* Export Actions */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">Export Results</h3>
                    <p className="text-xs text-blue-700">Download complete results including transcript, SOAP note, and coding suggestions</p>
                  </div>
                  <button
                    onClick={exportResultAsJson}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                    title="Export entire result as JSON file"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </button>
                </div>
              </div>
              {/* Safety Warning */}
              {result.safety_flags.high_risk && (
                <div className="bg-red-100 border border-red-400 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800 mb-2">
                        ⚠️ High-Risk Content Detected
                      </h3>
                      <p className="text-sm text-red-700 mb-3">
                        Emergency terms detected: {result.safety_flags.emergency_terms.join(', ')}
                      </p>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={safetyAcknowledged}
                          onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                          className="rounded border-red-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-red-800">
                          I understand this is not a triage tool
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SOAP Note */}
              {(!result.safety_flags.high_risk || safetyAcknowledged) && (
                <>
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium text-gray-900">
                        2. Generated SOAP Note
                      </h2>
                      <button
                        onClick={copyAllSoap}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                        title="Copy entire SOAP note"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy All
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Subjective</h4>
                          <button
                            onClick={() => copySoapSection('Subjective', result.soap_note.subjective)}
                            className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded hover:bg-gray-50"
                            title="Copy subjective section"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </button>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{result.soap_note.subjective}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Objective</h4>
                          <button
                            onClick={() => copySoapSection('Objective', result.soap_note.objective)}
                            className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded hover:bg-gray-50"
                            title="Copy objective section"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </button>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{result.soap_note.objective}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Assessment</h4>
                          <button
                            onClick={() => copySoapSection('Assessment', result.soap_note.assessment)}
                            className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded hover:bg-gray-50"
                            title="Copy assessment section"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </button>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{result.soap_note.assessment}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Plan</h4>
                          <button
                            onClick={() => copySoapSection('Plan', result.soap_note.plan)}
                            className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded hover:bg-gray-50"
                            title="Copy plan section"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </button>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{result.soap_note.plan}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Problem List</h4>
                        <div className="space-y-2">
                          {result.soap_note.problem_list.map((item, index) => (
                            <div key={index} className="bg-gray-50 rounded p-3">
                              <div className="font-medium text-gray-900">{item.problem}</div>
                              <div className="text-sm text-gray-600 mt-1">{item.rationale}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coding Suggestions */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium text-gray-900">
                        3. Coding Suggestions
                      </h2>
                      <button
                        onClick={copyCodingSuggestions}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                        title="Copy coding suggestions"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </button>
                    </div>

                    {/* ICD-10 Codes */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">ICD-10 Diagnosis Codes</h4>
                      <div className="space-y-2">
                        {result.coding_suggestions.icd_codes.map((code, index) => (
                          <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                              <div className="font-mono font-semibold text-primary-600">{code.code}</div>
                              <div className="text-sm text-gray-700">{code.description}</div>
                            </div>
                            <div className="ml-4">
                              <span className={getConfidenceBadge(code.confidence)}>
                                {code.confidence}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Billing Hint */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Billing Hint</h4>
                      <div className="p-3 bg-blue-50 rounded">
                        <div className="font-medium text-blue-900">{result.coding_suggestions.billing_hint.suggestion}</div>
                        <div className="text-sm text-blue-700 mt-1">{result.coding_suggestions.billing_hint.justification}</div>
                      </div>
                    </div>

                    {/* CPT Codes (if provided) */}
                    {result.coding_suggestions.cpt_codes && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">CPT Procedure Codes</h4>
                        <div className="space-y-2">
                          {result.coding_suggestions.cpt_codes.map((code, index) => (
                            <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                              <div className="flex-1">
                                <div className="font-mono font-semibold text-medical-600">{code.code}</div>
                                <div className="text-sm text-gray-700">{code.description}</div>
                                <div className="text-xs text-gray-500 mt-1">{code.justification}</div>
                              </div>
                              <div className="ml-4">
                                <span className={getConfidenceBadge(code.confidence)}>
                                  {code.confidence}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Decision Log & Traceability */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium text-gray-900">
                        4. Decision Log & Traceability
                      </h2>
                      <button
                        onClick={() => setShowPrompts(!showPrompts)}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                      >
                        {showPrompts ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {showPrompts ? 'Hide' : 'Show'} Prompts
                      </button>
                    </div>

                    {/* Decision Steps */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Processing Steps</h4>
                      <div className="space-y-2">
                        {result.decision_log.map((step, index) => (
                          <div key={index} className="flex items-start p-2 bg-gray-50 rounded">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{step.step}</div>
                              <div className="text-sm text-gray-600">{step.description}</div>
                              <div className="text-xs text-gray-400">{step.timestamp}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Prompts */}
                    {showPrompts && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">SOAP Generation Prompt</h4>
                          <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                            {result.prompts_used.soap_prompt}
                          </pre>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Coding Suggestions Prompt</h4>
                          <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                            {result.prompts_used.coding_prompt}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptProcessor;