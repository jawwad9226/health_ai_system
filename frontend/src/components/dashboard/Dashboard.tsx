import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHealth } from '../../context/HealthContext';
import { usePrediction } from '../../context/PredictionContext';
import { useRecommendation } from '../../context/RecommendationContext';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
} from '@mui/material';
import HealthOverview from './HealthOverview';
import RiskChart from '../RiskVisualization/RiskChart';
import RecommendationList from '../RecommendationVisualization/RecommendationList';
import HealthTrends from '../TrendsVisualization/HealthTrends';
import DashboardLayout from './DashboardLayout';
import ExportButton from '../common/ExportButton';
import { exportDashboardData } from '../../utils/export';
import { FilterPanel } from '../common/FilterPanel';
import { FilterConfig } from '../../types/filter';
import { applyFilters } from '../../utils/filterUtils';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { currentRecord, history: healthHistory, loading: healthLoading, error: healthError, fetchLatestRecord, fetchHistory } = useHealth();
  const { currentPrediction, loading: predictionLoading, error: predictionError, fetchLatestPrediction } = usePrediction();
  const { recommendations, loading: recommendationsLoading, error: recommendationsError, fetchRecommendations } = useRecommendation();
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('1M');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const filterConfig: FilterConfig = {
    fields: [
      {
        name: 'patientName',
        label: 'Patient Name',
        type: 'string',
        operators: ['equals', 'contains', 'starts with'],
      },
      {
        name: 'age',
        label: 'Age',
        type: 'number',
        operators: ['equals', 'greater than', 'less than', 'between'],
      },
      {
        name: 'lastVisit',
        label: 'Last Visit',
        type: 'date',
        operators: ['after', 'before', 'between'],
      },
      {
        name: 'riskLevel',
        label: 'Risk Level',
        type: 'string',
        operators: ['equals', 'not equals'],
      },
    ],
    storageKey: 'health_dashboard',
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadDashboardData = async () => {
      try {
        await Promise.all([
          fetchLatestRecord(),
          fetchLatestPrediction(),
          fetchRecommendations(),
          fetchHistory(),
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const loading = healthLoading || predictionLoading || recommendationsLoading;
  const hasError = healthError || predictionError || recommendationsError;

  const handleRefresh = () => {
    fetchLatestRecord();
    fetchLatestPrediction();
    fetchRecommendations();
    fetchHistory();
  };

  const handleTimeRangeChange = (range: '1W' | '1M' | '3M' | '6M' | '1Y') => {
    setTimeRange(range);
    fetchHistory();
  };

  const handleExport = async () => {
    await exportDashboardData({
      healthData: currentRecord,
      predictions: currentPrediction,
      recommendations,
      history: healthHistory,
    });
  };

  const handleFilterChange = (conditions: FilterCondition[]) => {
    const fieldTypes = filterConfig.fields.reduce((acc, field) => {
      acc[field.name] = field.type;
      return acc;
    }, {} as Record<string, string>);

    const filtered = applyFilters(healthHistory, conditions, fieldTypes);
    setFilteredData(filtered);
  };

  const dashboardWidgets = [
    {
      id: 'health-overview',
      title: 'Health Overview',
      component: <HealthOverview data={currentRecord} />,
      defaultSize: { w: 6, h: 4 },
    },
    {
      id: 'risk-prediction',
      title: 'Risk Prediction',
      component: <RiskChart data={currentPrediction} />,
      defaultSize: { w: 6, h: 4 },
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      component: <RecommendationList recommendations={recommendations} />,
      defaultSize: { w: 6, h: 6 },
    },
    {
      id: 'health-trends',
      title: 'Health Trends',
      component: (
        <HealthTrends
          data={filteredData.length > 0 ? filteredData : healthHistory}
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
        />
      ),
      defaultSize: { w: 12, h: 6 },
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Health Dashboard
          </Typography>
          <ExportButton
            data={filteredData.length > 0 ? filteredData : healthHistory}
            filterDescription={''}
            title="Health Data Report"
            fileName="health_dashboard_export"
          />
        </Box>
        
        <FilterPanel
          config={filterConfig}
          onFilterChange={handleFilterChange}
        />
        
        {/* Dashboard Content */}
        <DashboardLayout widgets={dashboardWidgets} />
      </Box>
    </Container>
  );
};

export default Dashboard;
