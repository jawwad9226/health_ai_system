import React, { useState } from 'react';
import api from '../../api/axiosConfig';

export default function PredictionForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [formData, setFormData] = useState({
    symptoms: '',
    duration: '',
    severity: 'mild',
    previousConditions: '',
    medications: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await api.post('/api/predictions/analyze', formData);
      setPrediction(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Health Risk Prediction
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Enter your symptoms and health information for a risk assessment.</p>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
              <div>
                <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">
                  Symptoms
                </label>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  rows={3}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Describe your symptoms..."
                  value={formData.symptoms}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  id="duration"
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="How long have you had these symptoms?"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                  Severity
                </label>
                <select
                  id="severity"
                  name="severity"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={formData.severity}
                  onChange={handleChange}
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>

              <div>
                <label htmlFor="previousConditions" className="block text-sm font-medium text-gray-700">
                  Previous Medical Conditions
                </label>
                <textarea
                  id="previousConditions"
                  name="previousConditions"
                  rows={2}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="List any previous medical conditions..."
                  value={formData.previousConditions}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="medications" className="block text-sm font-medium text-gray-700">
                  Current Medications
                </label>
                <textarea
                  id="medications"
                  name="medications"
                  rows={2}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="List any medications you're currently taking..."
                  value={formData.medications}
                  onChange={handleChange}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Analyzing...' : 'Get Prediction'}
                </button>
              </div>
            </form>

            {prediction && (
              <div className="mt-6 bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h4 className="text-lg font-medium text-gray-900">Prediction Results</h4>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Risk Level</h5>
                      <p className="mt-1 text-sm text-gray-900">{prediction.riskLevel}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Recommendations</h5>
                      <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                        {prediction.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    {prediction.additionalNotes && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Additional Notes</h5>
                        <p className="mt-1 text-sm text-gray-900">{prediction.additionalNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
