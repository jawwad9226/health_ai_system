import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Charts from '../visualization/Charts';
import { exportToCSV, exportToExcel, exportToPDF, prepareHealthDataForExport } from '../../utils/exportData';

export default function Dashboard() {
  const [healthRecord, setHealthRecord] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch latest health record and history
        const [latestResponse, historyResponse] = await Promise.all([
          api.get('/api/health-records/latest'),
          api.get('/api/health-records/history')
        ]);

        setHealthRecord(latestResponse.data);
        setHealthHistory(historyResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 404) {
          setHealthRecord(null);
          setHealthHistory([]);
        } else {
          setError(err.response?.data?.error || 'Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleCreateHealthRecord = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const defaultHealthData = {
        age: 30,
        gender: 'Not specified',
        health_data: {
          height: 170,
          weight: 70,
          blood_pressure: '120/80',
          heart_rate: 75,
          blood_sugar: 90,
          cholesterol: 180
        },
        notes: 'Initial health record'
      };

      const response = await api.post('/api/health-records', defaultHealthData);
      setHealthRecord(response.data.record);
    } catch (err) {
      console.error('Error creating health record:', err);
      setError(err.response?.data?.error || 'Failed to create health record');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!healthRecord) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Welcome to Your Health Dashboard
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Let's start by creating your health profile
            </p>
            <div className="mt-8">
              <button
                onClick={handleCreateHealthRecord}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Health Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Your Health Overview
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Last updated: {new Date(healthRecord.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Age</dt>
                <dd className="mt-1 text-sm text-gray-900">{healthRecord.age}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="mt-1 text-sm text-gray-900">{healthRecord.gender}</dd>
              </div>
              {Object.entries(healthRecord.health_data).map(([key, value]) => (
                <div key={key} className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        {healthHistory.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Health Metrics Visualization</h2>
            <Charts healthData={healthHistory} />
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => exportToCSV(prepareHealthDataForExport(healthHistory), 'health-data')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export to CSV
              </button>
              <button
                onClick={() => exportToExcel(prepareHealthDataForExport(healthHistory), 'health-data')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export to Excel
              </button>
              <button
                onClick={() => exportToPDF(prepareHealthDataForExport(healthHistory), 'health-data')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Export to PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
