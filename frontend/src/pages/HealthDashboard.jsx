import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import HealthRecordForm from '../components/HealthRecordForm/HealthRecordForm';
import RiskVisualization from '../components/RiskVisualization/RiskVisualization';
import RecommendationDisplay from '../components/RecommendationSystem/RecommendationDisplay';
import ModelTrainingInterface from '../components/ModelTraining/ModelTrainingInterface';

const HealthDashboard = () => {
  const [activeTab, setActiveTab] = useState('health-record');
  const [healthData, setHealthData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [healthResponse, riskResponse, recommendationsResponse] = await Promise.all([
        axios.get('/api/health-records/latest'),
        axios.get('/api/risk-predictions/latest'),
        axios.get('/api/recommendations')
      ]);

      setHealthData(healthResponse.data);
      setRiskData(riskResponse.data);
      setRecommendations(recommendationsResponse.data);
    } catch (error) {
      toast.error('Error fetching dashboard data');
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'health-record', name: 'Health Record', icon: '📋' },
    { id: 'risk-analysis', name: 'Risk Analysis', icon: '📊' },
    { id: 'recommendations', name: 'Recommendations', icon: '💡' },
    { id: 'model-training', name: 'Model Training', icon: '🧠' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'health-record':
        return <HealthRecordForm initialData={healthData} onSubmit={fetchDashboardData} />;
      case 'risk-analysis':
        return <RiskVisualization riskData={riskData} />;
      case 'recommendations':
        return <RecommendationDisplay recommendations={recommendations} />;
      case 'model-training':
        return <ModelTrainingInterface />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor your health metrics, analyze risks, and get personalized recommendations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.icon} {tab.name}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex space-x-4" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  } px-3 py-2 font-medium text-sm rounded-md`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default HealthDashboard;
