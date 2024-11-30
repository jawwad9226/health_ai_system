import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

const SYMPTOMS = [
  'fever', 'cough', 'fatigue', 'difficulty_breathing', 'body_aches',
  'headache', 'loss_of_taste', 'loss_of_smell', 'sore_throat', 'congestion',
  'nausea', 'diarrhea', 'chest_pain', 'dizziness'
];

export default function PredictionForm() {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    symptoms: [],
    temperature: '',
    oxygen_level: '',
    additional_notes: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleSymptomChange = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const validateForm = () => {
    if (!formData.age || formData.age < 0 || formData.age > 120) {
      setError('Please enter a valid age (0-120)');
      return false;
    }
    if (!formData.gender) {
      setError('Please select your gender');
      return false;
    }
    if (formData.symptoms.length === 0) {
      setError('Please select at least one symptom');
      return false;
    }
    if (!formData.temperature || formData.temperature < 35 || formData.temperature > 42) {
      setError('Please enter a valid temperature (35-42°C)');
      return false;
    }
    if (!formData.oxygen_level || formData.oxygen_level < 70 || formData.oxygen_level > 100) {
      setError('Please enter a valid oxygen level (70-100%)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await api.post('/api/predictions', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setResult(response.data);
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.response?.data?.error || 'An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Health Analysis</h2>
            <p className="mt-1 text-gray-600">
              Fill in your symptoms and vital signs for a health prediction
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms
              </label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {SYMPTOMS.map((symptom) => (
                  <div key={symptom} className="relative flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        checked={formData.symptoms.includes(symptom)}
                        onChange={() => handleSymptomChange(symptom)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="text-gray-700">
                        {symptom.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vital Signs */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="temperature"
                  value={formData.temperature}
                  onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="oxygen_level" className="block text-sm font-medium text-gray-700">
                  Oxygen Level (%)
                </label>
                <input
                  type="number"
                  id="oxygen_level"
                  value={formData.oxygen_level}
                  onChange={(e) => setFormData({...formData, oxygen_level: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="bloodPressureSystolic" className="block text-sm font-medium text-gray-700">
                  Blood Pressure Systolic (mmHg)
                </label>
                <input
                  type="number"
                  id="bloodPressureSystolic"
                  value={formData.bloodPressureSystolic}
                  onChange={(e) => setFormData({...formData, bloodPressureSystolic: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="bloodPressureDiastolic" className="block text-sm font-medium text-gray-700">
                  Blood Pressure Diastolic (mmHg)
                </label>
                <input
                  type="number"
                  id="bloodPressureDiastolic"
                  value={formData.bloodPressureDiastolic}
                  onChange={(e) => setFormData({...formData, bloodPressureDiastolic: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Heart Rate */}
            <div>
              <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700">
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                id="heartRate"
                value={formData.heartRate}
                onChange={(e) => setFormData({...formData, heartRate: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                id="additional_notes"
                rows={3}
                value={formData.additional_notes}
                onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Any other symptoms or concerns..."
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  loading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  'Get Prediction'
                )}
              </button>
            </div>
          </form>

          {result && (
            <div className="mt-8 rounded-md bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Analysis Result</h3>
              <div className="mt-4">
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        {result.prediction}
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Confidence: {Math.round(result.confidence * 100)}%</p>
                        {result.recommendations && (
                          <p className="mt-2">{result.recommendations}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
