import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin,
  User
} from 'lucide-react';
import { patientAPI, handleAPIError } from '@/services/api';
import { Patient } from '@/types';
import toast from 'react-hot-toast';

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPatientData();
    }
  }, [id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      if (!id) return;
      
      const patientData = await patientAPI.getById(id);
      setPatient(patientData);
    } catch (error) {
      console.error('Error loading patient:', error);
      toast.error(handleAPIError(error));
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };


  const calculateAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };


  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="h-4 bg-gray-200 rounded w-32 mr-6"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-28"></div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="h-5 w-5 bg-gray-200 rounded mr-3"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Patient not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The patient you're looking for doesn't exist or has been deleted.
        </p>
        <div className="mt-6">
          <Link to="/patients" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mr-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Patients
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-gray-600">
              MRN: {patient.medical_record_number}
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <Link
            to="/transcript"
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Process Transcript
          </Link>
          <button className="btn btn-secondary">
            <Edit className="h-4 w-4 mr-2" />
            Edit Patient
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Patient Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Patient Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Age {calculateAge(patient.date_of_birth)}
                </p>
                <p className="text-sm text-gray-500">
                  Born {formatDate(patient.date_of_birth)}
                </p>
              </div>
            </div>

            {patient.gender && (
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Gender</p>
                  <p className="text-sm text-gray-500">{patient.gender}</p>
                </div>
              </div>
            )}

            {patient.phone && (
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-500">
                    <a href={`tel:${patient.phone}`} className="hover:text-primary-600">
                      {patient.phone}
                    </a>
                  </p>
                </div>
              </div>
            )}

            {patient.email && (
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-500">
                    <a href={`mailto:${patient.email}`} className="hover:text-primary-600 break-words">
                      {patient.email}
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>

          {patient.address && (
            <div className="flex items-start mt-6">
              <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Address</p>
                <p className="text-sm text-gray-500 whitespace-pre-wrap">
                  {patient.address}
                </p>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200 mt-6">
            <p className="text-xs text-gray-500">
              Patient since {formatDate(patient.created_at)}
            </p>
            {patient.updated_at !== patient.created_at && (
              <p className="text-xs text-gray-500">
                Last updated {formatDate(patient.updated_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;