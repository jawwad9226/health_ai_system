import React from 'react';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import TestComponent from './TestComponent';

describe('TestComponent', () => {
  it('shows loading state initially', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders data after loading', async () => {
    const onLoad = jest.fn();
    render(<TestComponent onLoad={onLoad} />);
    
    // Wait for loading to finish
    await waitForElementToBeRemoved(() => screen.queryByTestId('loading'));
    
    // Check if data is rendered
    expect(screen.getByTestId('data')).toHaveTextContent('Test Data');
    expect(onLoad).toHaveBeenCalledWith('Test Data');
  });

  it('displays the correct message with data', async () => {
    const testMessage = 'Test Message';
    render(<TestComponent message={testMessage} />);
    
    // Wait for loading to finish
    await waitForElementToBeRemoved(() => screen.queryByTestId('loading'));
    
    // Check both message and data are present
    expect(screen.getByText(testMessage)).toBeInTheDocument();
    expect(screen.getByTestId('data')).toHaveTextContent('Test Data');
  });
});
