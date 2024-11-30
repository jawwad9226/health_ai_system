import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModelTrainingInterface = () => {
  const [trainingStatus, setTrainingStatus] = useState('idle');
  const [modelMetrics, setModelMetrics] = useState(null);
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [modelConfig, setModelConfig] = useState({
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2,
    architecture: 'default'
  });

  useEffect(() => {
    // Fetch available datasets
    fetchAvailableDatasets();
  }, []);

  const fetchAvailableDatasets = async () => {
    try {
      const response = await axios.get('/api/datasets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAvailableDatasets(response.data);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    }
  };

  const handleDatasetSelection = (datasetId) => {
    setSelectedDatasets(prev => {
      if (prev.includes(datasetId)) {
        return prev.filter(id => id !== datasetId);
      }
      return [...prev, datasetId];
    });
  };

  const handleConfigChange = (key, value) => {
    setModelConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const startTraining = async () => {
    try {
      setTrainingStatus('training');
      setTrainingProgress(0);
      setTrainingLogs([]);

      const response = await axios.post('/api/model/train', {
        datasets: selectedDatasets,
        config: modelConfig
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Setup WebSocket connection for real-time updates
      const ws = new WebSocket(response.data.websocketUrl);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'progress') {
          setTrainingProgress(data.progress);
        } else if (data.type === 'log') {
          setTrainingLogs(prev => [...prev, data.message]);
        } else if (data.type === 'complete') {
          setTrainingStatus('complete');
          setModelMetrics(data.metrics);
          ws.close();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setTrainingStatus('error');
      };

    } catch (error) {
      console.error('Error starting training:', error);
      setTrainingStatus('error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Model Training Interface</h2>

      {/* Dataset Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Training Datasets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableDatasets.map(dataset => (
            <div
              key={dataset.id}
              className={`p-4 border rounded-lg cursor-pointer ${
                selectedDatasets.includes(dataset.id)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
              onClick={() => handleDatasetSelection(dataset.id)}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedDatasets.includes(dataset.id)}
                  onChange={() => {}}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div>
                  <h4 className="font-medium">{dataset.name}</h4>
                  <p className="text-sm text-gray-500">{dataset.recordCount} records</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Configuration */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Model Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Epochs</label>
            <input
              type="number"
              value={modelConfig.epochs}
              onChange={(e) => handleConfigChange('epochs', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Batch Size</label>
            <input
              type="number"
              value={modelConfig.batchSize}
              onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Learning Rate</label>
            <input
              type="number"
              step="0.0001"
              value={modelConfig.learningRate}
              onChange={(e) => handleConfigChange('learningRate', parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Validation Split</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={modelConfig.validationSplit}
              onChange={(e) => handleConfigChange('validationSplit', parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Model Architecture</label>
            <select
              value={modelConfig.architecture}
              onChange={(e) => handleConfigChange('architecture', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="default">Default Architecture</option>
              <option value="lightweight">Lightweight</option>
              <option value="complex">Complex</option>
            </select>
          </div>
        </div>
      </div>

      {/* Training Controls and Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={startTraining}
            disabled={trainingStatus === 'training' || selectedDatasets.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {trainingStatus === 'training' ? 'Training in Progress...' : 'Start Training'}
          </button>
          
          {trainingStatus === 'training' && (
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-gray-600">
                Progress: {Math.round(trainingProgress)}%
              </div>
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Training Logs */}
      {trainingLogs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Training Logs</h3>
          <div className="bg-gray-50 p-4 rounded-lg h-48 overflow-y-auto">
            {trainingLogs.map((log, index) => (
              <div key={index} className="text-sm font-mono text-gray-600">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Metrics */}
      {modelMetrics && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Training Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Accuracy</div>
              <div className="text-2xl font-bold text-indigo-600">
                {(modelMetrics.accuracy * 100).toFixed(2)}%
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Loss</div>
              <div className="text-2xl font-bold text-indigo-600">
                {modelMetrics.loss.toFixed(4)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">F1 Score</div>
              <div className="text-2xl font-bold text-indigo-600">
                {modelMetrics.f1Score.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelTrainingInterface;
