import React from 'react';
import { render, screen } from '../utils/test-utils';
import RiskAssessment from '../../components/widgets/RiskAssessment';
import { mockRiskAssessment } from '../utils/mockData';

describe('RiskAssessment', () => {
  it('renders loading state when no data is provided', () => {
    render(<RiskAssessment data={null} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders risk assessment data correctly', () => {
    render(<RiskAssessment data={mockRiskAssessment} />);

    // Check risk level
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();

    // Check risk factors
    mockRiskAssessment.risk_factors.forEach(factor => {
      expect(screen.getByText(factor.name)).toBeInTheDocument();
      expect(screen.getByText(factor.description)).toBeInTheDocument();
      expect(screen.getByText(factor.severity)).toBeInTheDocument();
    });

    // Check recommendations
    mockRiskAssessment.recommendations.forEach(recommendation => {
      expect(screen.getByText(recommendation.title)).toBeInTheDocument();
      expect(screen.getByText(recommendation.description)).toBeInTheDocument();
    });

    // Check confidence score
    expect(screen.getByText(/85/)).toBeInTheDocument();
  });

  it('displays appropriate colors for different risk levels', () => {
    const highRiskData = {
      ...mockRiskAssessment,
      risk_level: 'high',
    };

    const { rerender } = render(<RiskAssessment data={highRiskData} />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();

    // Test medium risk
    rerender(<RiskAssessment data={mockRiskAssessment} />);
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();

    // Test low risk
    const lowRiskData = {
      ...mockRiskAssessment,
      risk_level: 'low',
    };
    rerender(<RiskAssessment data={lowRiskData} />);
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('handles empty risk factors and recommendations', () => {
    const emptyData = {
      ...mockRiskAssessment,
      risk_factors: [],
      recommendations: [],
    };

    render(<RiskAssessment data={emptyData} />);

    // Should still render main sections
    expect(screen.getByText('Key Risk Factors')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });
});
