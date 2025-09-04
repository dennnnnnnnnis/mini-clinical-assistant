import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  History, 
  Activity,
  Plus,
  MessageSquare
} from 'lucide-react';
import { patientAPI, handleAPIError } from '@/services/api';
import { Patient, Session } from '@/types';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalSessions: 0,
    recentPatients: [] as Patient[],
    recentSessions: [] as Session[],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  // load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load data in parallel
      const [patientsResponse, sessionsResponse] = await Promise.all([
        patientAPI.getAll({ limit: 5 }),
        fetchSessions()
      ]);

      setStats({
        totalPatients: patientsResponse.pagination?.total || patientsResponse.patients?.length || 0,
        totalSessions: sessionsResponse.sessions?.length || 0,
        recentPatients: patientsResponse.patients || [],
        recentSessions: (sessionsResponse.sessions || []).slice(0, 5),
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const apiUrl = '/api';
      const response = await fetch(`${apiUrl}/sessions`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return { sessions: [] };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your clinical assistant dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Processing Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.recentSessions.filter(s => {
                  const sessionDate = new Date(s.created_at);
                  const now = new Date();
                  const diff = now.getTime() - sessionDate.getTime();
                  return diff < (24 * 60 * 60 * 1000); // Last 24 hours
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Patients */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Patients</h2>
              <Link to="/patients" className="text-sm text-primary-600 hover:text-primary-900">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentPatients.length > 0 ? (
              stats.recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  to={`/patients/${patient.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        MRN: {patient.medical_record_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {formatDate(patient.created_at)}
                      </p>
                      <p className="text-xs text-gray-400">
                        DOB: {formatDate(patient.date_of_birth)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No patients</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new patient.
                </p>
                <div className="mt-6">
                  <Link 
                    to="/patients/new" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Patient
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Sessions</h2>
              <Link to="/sessions" className="text-sm text-primary-600 hover:text-primary-900">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentSessions.length > 0 ? (
              stats.recentSessions.map((session) => {
                const hasSoapNote = session.soap_note !== null;
                const hasCoding = session.coding_suggestions !== null;
                const hasSafetyFlags = session.safety_flags !== null;
                
                return (
                  <div
                    key={session.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Session #{session.id}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {session.transcript.substring(0, 80)}...
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {hasSoapNote && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              SOAP Note
                            </span>
                          )}
                          {hasCoding && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Coding
                            </span>
                          )}
                          {hasSafetyFlags && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Safety Alert
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-gray-500">
                          {formatDate(session.created_at)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTime(session.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Process your first transcript to see it here.
                </p>
                <div className="mt-6">
                  <Link 
                    to="/transcript" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Process Transcript
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-gradient-to-r from-medical-500 to-medical-600 rounded-lg shadow-sm">
          <div className="px-6 py-8">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-medium text-white">
                  Ready to get started?
                </h2>
                <p className="mt-1 text-medical-100">
                  Create your first patient or process consultation transcripts with AI assistance.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-wrap gap-4">
                <Link 
                  to="/patients/new" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-white text-medical-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-500 transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add Patient
                </Link>
                <Link 
                  to="/transcript" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Process Transcript
                </Link>
                <Link 
                  to="/sessions" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-medical-700 text-white hover:bg-medical-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-500 transition-colors"
                >
                  <History className="h-4 w-4 mr-2" />
                  View Sessions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;