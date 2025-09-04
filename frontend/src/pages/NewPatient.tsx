import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { patientAPI, handleAPIError } from '@/services/api';
import { PatientFormData } from '@/types';
import toast from 'react-hot-toast';

const NewPatient: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientFormData>();

  const onSubmit = async (data: PatientFormData) => {
    try {
      setLoading(true);
      const patient = await patientAPI.create(data);
      
      toast.success('Patient created successfully');
      navigate(`/patients/${patient.id}`);
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Patients
        </button>
        
        <div className="flex items-center">
          <div className="p-2 bg-primary-100 rounded-lg mr-4">
            <Users className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
            <p className="text-gray-600">Enter patient information to create a new record</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Patient Information</h2>
          
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="label">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('first_name', { 
                  required: 'First name is required',
                  minLength: { value: 2, message: 'First name must be at least 2 characters' }
                })}
                className="input"
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>
            
            <div>
              <label className="label">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('last_name', { 
                  required: 'Last name is required',
                  minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                })}
                className="input"
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Birth Date and Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="label">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('date_of_birth', { 
                  required: 'Date of birth is required',
                  validate: (value) => {
                    const birthDate = new Date(value);
                    const today = new Date();
                    if (birthDate > today) {
                      return 'Date of birth cannot be in the future';
                    }
                    return true;
                  }
                })}
                className="input"
              />
              {errors.date_of_birth && (
                <p className="mt-1 text-sm text-red-600">{errors.date_of_birth.message}</p>
              )}
            </div>
            
            <div>
              <label className="label">Gender</label>
              <select
                {...register('gender')}
                className="input"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                {...register('phone', {
                  pattern: {
                    value: /^[\d\s\-\(\)\+]+$/,
                    message: 'Please enter a valid phone number'
                  }
                })}
                className="input"
                placeholder="(555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
            
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                className="input"
                placeholder="patient@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="mb-6">
            <label className="label">Address</label>
            <textarea
              {...register('address')}
              className="textarea"
              rows={3}
              placeholder="Enter full address"
            />
          </div>

          {/* Medical Record Number */}
          <div>
            <label className="label">Medical Record Number</label>
            <input
              type="text"
              {...register('medical_record_number', {
                pattern: {
                  value: /^[A-Z0-9]+$/i,
                  message: 'MRN should contain only letters and numbers'
                }
              })}
              className="input"
              placeholder="Leave empty to auto-generate"
            />
            {errors.medical_record_number && (
              <p className="mt-1 text-sm text-red-600">{errors.medical_record_number.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              If left empty, a medical record number will be automatically generated.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Patient
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPatient;