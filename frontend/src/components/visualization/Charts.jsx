import React, { useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Charts = ({ healthData }) => {
  // Memoize chart options and data to prevent unnecessary re-renders
  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Health Metrics Over Time',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  }), []);

  const riskChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Risk Assessment',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (context) => `Risk Level: ${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
  }), []);

  const prepareHealthMetricsData = useMemo(() => {
    if (!healthData?.length) return null;

    const dates = healthData.map(record => 
      new Date(record.date).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      })
    );

    return {
      labels: dates,
      datasets: [
        {
          label: 'Blood Pressure',
          data: healthData.map(record => record.blood_pressure),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Heart Rate',
          data: healthData.map(record => record.heart_rate),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'BMI',
          data: healthData.map(record => record.bmi),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [healthData]);

  const prepareRiskData = useMemo(() => {
    if (!healthData?.length) return null;
    
    const latestRecord = healthData[healthData.length - 1];
    const riskScores = latestRecord.risk_scores || {};

    return {
      labels: ['Cardiovascular', 'Diabetes', 'Respiratory', 'Mental Health', 'Overall'],
      datasets: [{
        label: 'Risk Level',
        data: [
          riskScores.cardiovascular || 0,
          riskScores.diabetes || 0,
          riskScores.respiratory || 0,
          riskScores.mental_health || 0,
          riskScores.overall || 0,
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderWidth: 1,
      }],
    };
  }, [healthData]);

  if (!healthData?.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No health data available for visualization</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-lg h-[400px]">
        <Line options={lineChartOptions} data={prepareHealthMetricsData} />
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg h-[400px]">
        <Bar options={riskChartOptions} data={prepareRiskData} />
      </div>
    </div>
  );
};

export default Charts;
