import React from 'react';
import { Line } from 'react-chartjs-2';
import { Box, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const VitalSignsChart = ({ data }) => {
  const theme = useTheme();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: theme.palette.divider,
        },
      },
      x: {
        grid: {
          color: theme.palette.divider,
        },
      },
    },
  };

  const prepareChartData = (vitalSigns) => {
    const dates = [...new Set(vitalSigns.map(vs => vs.measurement_time))].sort();
    const types = [...new Set(vitalSigns.map(vs => vs.measurement_type))];

    const datasets = types.map(type => {
      const typeData = vitalSigns.filter(vs => vs.measurement_type === type);
      const values = dates.map(date => {
        const measurement = typeData.find(td => td.measurement_time === date);
        return measurement ? measurement.value : null;
      });

      return {
        label: type,
        data: values,
        fill: false,
        borderColor: getRandomColor(),
        tension: 0.1,
      };
    });

    return {
      labels: dates,
      datasets,
    };
  };

  const getRandomColor = () => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.success.main,
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <Line options={chartOptions} data={prepareChartData(data)} />
    </Box>
  );
};

export default VitalSignsChart;
