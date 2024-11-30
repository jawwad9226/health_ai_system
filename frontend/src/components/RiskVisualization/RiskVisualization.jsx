import React, { useEffect, useState } from 'react';
import { Line, Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RiskVisualization = ({ riskData }) => {
  const [activeTab, setActiveTab] = useState('timeline');

  const timelineData = {
    labels: riskData?.timeline?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Overall Risk Score',
        data: riskData?.timeline?.map(item => item.score) || [],
        fill: true,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      }
    ]
  };

  const radarData = {
    labels: ['Cardiovascular', 'Diabetes', 'Respiratory', 'Mental Health', 'Musculoskeletal', 'Cancer'],
    datasets: [
      {
        label: 'Risk Factors',
        data: riskData?.factors || [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(255, 99, 132)'
      }
    ]
  };

  const contributingFactorsData = {
    labels: riskData?.contributingFactors?.map(factor => factor.name) || [],
    datasets: [
      {
        label: 'Impact Score',
        data: riskData?.contributingFactors?.map(factor => factor.impact) || [],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Risk Assessment Visualization'
      }
    }
  };

  const radarOptions = {
    ...options,
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
  };

  const barOptions = {
    ...options,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <button
            className={`py-2 px-4 ${activeTab === 'timeline' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'radar' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('radar')}
          >
            Risk Categories
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'factors' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('factors')}
          >
            Contributing Factors
          </button>
        </div>
      </div>

      <div className="h-[400px]">
        {activeTab === 'timeline' && (
          <Line data={timelineData} options={options} />
        )}
        {activeTab === 'radar' && (
          <Radar data={radarData} options={radarOptions} />
        )}
        {activeTab === 'factors' && (
          <Bar data={contributingFactorsData} options={barOptions} />
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Risk Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Overall Risk Score</div>
            <div className="text-2xl font-bold text-indigo-600">
              {riskData?.currentScore || 'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Risk Level</div>
            <div className="text-2xl font-bold text-indigo-600">
              {riskData?.riskLevel || 'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Trend</div>
            <div className="text-2xl font-bold text-indigo-600">
              {riskData?.trend || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskVisualization;
