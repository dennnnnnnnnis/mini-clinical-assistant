import React, { useState, useEffect } from 'react';
import { History, Calendar, Clock, FileText, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Session, ParsedSoapNote, ParsedCodingData, ParsedSafetyFlags } from '@/types';

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const apiUrl = '/api';
      const response = await fetch(`${apiUrl}/sessions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: number) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      const apiUrl = '/api';
      const response = await fetch(`${apiUrl}/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
      
      setSessions(sessions.filter(session => session.id !== sessionId));
      toast.success('Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatTranscriptPreview = (transcript: string) => {
    return transcript.length > 150 ? transcript.substring(0, 150) + '...' : transcript;
  };

  const viewSession = (session: Session) => {
    try {
      console.log('Opening session:', session);
      setSelectedSession(session);
      setShowModal(true);
    } catch (error) {
      console.error('Error opening session:', error);
      toast.error('Error opening session details');
    }
  };

  const parseSoapNote = (soapNoteString: string | null): ParsedSoapNote => {
    if (!soapNoteString) return {};
    try {
      const parsed = JSON.parse(soapNoteString);
      return parsed || {};
    } catch (error) {
      console.error('Error parsing SOAP note:', error);
      return {};
    }
  };

  const parseCodingData = (codingString: string | null): ParsedCodingData => {
    if (!codingString) return {};
    try {
      const parsed = JSON.parse(codingString);
      return parsed || {};
    } catch (error) {
      console.error('Error parsing coding data:', error);
      return {};
    }
  };

  const parseSafetyFlags = (safetyString: string | null): ParsedSafetyFlags => {
    if (!safetyString) return {};
    try {
      const parsed = JSON.parse(safetyString);
      return parsed || {};
    } catch (error) {
      console.error('Error parsing safety flags:', error);
      return {};
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session History</h1>
          <p className="mt-2 text-gray-600">
            View and manage your transcript processing sessions
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <History className="h-5 w-5" />
          <span>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <History className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Process your first transcript to see it here
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {sessions.map((session) => {
              const soapNote = parseSoapNote(session.soap_note);
              const safetyFlags = parseSafetyFlags(session.safety_flags);
              
              return (
                <li key={session.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Session #{session.id}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatTranscriptPreview(session.transcript)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(session.created_at)}</span>
                          </div>
                          
                          {soapNote.subjective && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              SOAP Note
                            </span>
                          )}
                          
                          {session.coding_suggestions && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Coding
                            </span>
                          )}
                          
                          {safetyFlags.hasRisks && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Safety Alert
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => viewSession(session)}
                          className="inline-flex items-center p-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-500"
                          title="View session details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="inline-flex items-center p-1.5 border border-red-300 rounded text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Delete session"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Session Detail Modal */}
      {showModal && selectedSession && selectedSession.id && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Session #{selectedSession.id} Details
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    try {
                      setShowModal(false);
                      setSelectedSession(null);
                    } catch (error) {
                      console.error('Error closing modal:', error);
                    }
                  }}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="mt-4 space-y-6 max-h-96 overflow-y-auto">
                {/* Original Transcript */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Original Transcript</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedSession.transcript || 'No transcript available'}</p>
                  </div>
                </div>

                {/* SOAP Note */}
                {selectedSession.soap_note && (() => {
                  try {
                    const soapNote = parseSoapNote(selectedSession.soap_note);
                    const entries = Object.entries(soapNote).filter(([_, value]) => value && value.toString().trim());
                    if (entries.length === 0) return null;
                    
                    return (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Generated SOAP Note</h4>
                        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                          {entries.map(([key, value]) => (
                            <div key={key}>
                              <h5 className="text-sm font-semibold text-blue-900 capitalize">{key.replace('_', ' ')}:</h5>
                              <p className="text-sm text-blue-700 mt-1">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering SOAP note:', error);
                    return (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Generated SOAP Note</h4>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <p className="text-sm text-red-700">Error loading SOAP note data</p>
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* Coding Suggestions */}
                {selectedSession.coding_suggestions && (() => {
                  try {
                    const coding = parseCodingData(selectedSession.coding_suggestions);
                    const hasData = (coding.icd_codes && coding.icd_codes.length > 0) || (coding.cpt_codes && coding.cpt_codes.length > 0);
                    if (!hasData) return null;
                    
                    return (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Coding Suggestions</h4>
                        <div className="bg-green-50 p-4 rounded-lg space-y-3">
                          {coding.icd_codes && coding.icd_codes.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-green-900">ICD-10 Codes:</h5>
                              <ul className="mt-1 space-y-1">
                                {coding.icd_codes.map((code, idx) => (
                                  <li key={idx} className="text-sm text-green-700">
                                    <span className="font-mono">{code.code || 'N/A'}</span> - {code.description || 'No description'}
                                    {code.confidence && (
                                      <span className="ml-2 text-xs bg-green-200 px-1 py-0.5 rounded">
                                        {code.confidence}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {coding.cpt_codes && coding.cpt_codes.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-green-900">CPT Codes:</h5>
                              <ul className="mt-1 space-y-1">
                                {coding.cpt_codes.map((code, idx) => (
                                  <li key={idx} className="text-sm text-green-700">
                                    <span className="font-mono">{code.code || 'N/A'}</span> - {code.description || 'No description'}
                                    {code.confidence && (
                                      <span className="ml-2 text-xs bg-green-200 px-1 py-0.5 rounded">
                                        {code.confidence}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering coding data:', error);
                    return (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Coding Suggestions</h4>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <p className="text-sm text-red-700">Error loading coding data</p>
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* Safety Flags */}
                {selectedSession.safety_flags && (() => {
                  try {
                    const safetyFlags = parseSafetyFlags(selectedSession.safety_flags);
                    const hasRisks = safetyFlags.hasRisks || safetyFlags.high_risk;
                    if (!hasRisks) return null;
                    
                    return (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Safety Alerts</h4>
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                            <div className="ml-3">
                              <h5 className="text-sm font-semibold text-red-900">High-Risk Content Detected</h5>
                              {safetyFlags.flags && safetyFlags.flags.length > 0 && (
                                <ul className="mt-2 text-sm text-red-700 space-y-1">
                                  {safetyFlags.flags.map((flag, idx) => (
                                    <li key={idx}>• {flag}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering safety flags:', error);
                    return null;
                  }
                })()}

                {/* Timestamp */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Processed on {formatDate(selectedSession.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    try {
                      setShowModal(false);
                      setSelectedSession(null);
                    } catch (error) {
                      console.error('Error closing modal:', error);
                    }
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
