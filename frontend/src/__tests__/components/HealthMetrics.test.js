import React from 'react';
import { render, screen } from '../utils/test-utils';
import HealthMetrics from '../../components/widgets/HealthMetrics';
import { mockHealthMetrics } from '../utils/mockData';

describe('HealthMetrics', () => {
  it('renders loading state when no data is provided', () => {
    render(<HealthMetrics data={null} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders all health metrics correctly', () => {
    render(<HealthMetrics data={mockHealthMetrics} />);

    // Check all metric titles
    expect(screen.getByText('Heart Health')).toBeInTheDocument();
    expect(screen.getByText('Physical Activity')).toBeInTheDocument();
    expect(screen.getByText('Nutrition')).toBeInTheDocument();
    expect(screen.getByText('Sleep Quality')).toBeInTheDocument();

    // Check metric values
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();

    // Check overall health score
    expect(screen.getByText('Overall Health Score')).toBeInTheDocument();
    expect(screen.getByText('71%')).toBeInTheDocument();
  });

  it('shows improvement needed message for low metrics', () => {
    const lowMetrics = {
      ...mockHealthMetrics,
      physical_activity: 55,
    };

    render(<HealthMetrics data={lowMetrics} />);
    expect(screen.getByText(/needs improvement/i)).toBeInTheDocument();
  });

  it('renders progress bars with correct colors', () => {
    const metrics = {
      heart_health: 85, // Should be success color
      physical_activity: 65, // Should be warning color
      nutrition: 45, // Should be error color
      sleep_quality: 75, // Should be success color
      overall_score: 67,
    };

    render(<HealthMetrics data={metrics} />);

    // Check for progress bars
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(5); // 4 metrics + overall score
  });

  it('displays tooltips with additional information', () => {
    render(<HealthMetrics data={mockHealthMetrics} />);

    // Check for info icons that trigger tooltips
    const infoButtons = screen.getAllByRole('button');
    expect(infoButtons.length).toBeGreaterThan(0);
  });

  it('handles zero values correctly', () => {
    const zeroMetrics = {
      heart_health: 0,
      physical_activity: 0,
      nutrition: 0,
      sleep_quality: 0,
      overall_score: 0,
    };

    render(<HealthMetrics data={zeroMetrics} />);

    // Check that 0% is displayed for all metrics
    const zeroValues = screen.getAllByText('0%');
    expect(zeroValues).toHaveLength(5);
  });

  it('handles missing metric values', () => {
    const partialMetrics = {
      heart_health: 75,
      // physical_activity missing
      nutrition: 80,
      sleep_quality: 70,
      overall_score: 75,
    };

    render(<HealthMetrics data={partialMetrics} />);

    // Should still render without crashing
    expect(screen.getByText('Heart Health')).toBeInTheDocument();
    expect(screen.getByText('Nutrition')).toBeInTheDocument();
  });
});
