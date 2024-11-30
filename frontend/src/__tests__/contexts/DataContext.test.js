import React from 'react';
import { act } from 'react-dom/test-utils';
import { render, screen, waitFor } from '../utils/test-utils';
import { DataProvider, useData } from '../../contexts/DataContext';
import {
  mockUser,
  mockAppointments,
  mockMedicalRecords,
  mockVitalSigns,
  mockRiskAssessment,
  mockHealthMetrics,
  mockAlerts,
} from '../utils/mockData';
import * as healthApi from '../../api/healthApi';

// Mock the healthApi
jest.mock('../../api/healthApi');

// Test component that uses the data context
const TestComponent = () => {
  const {
    data,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    fetchMedicalRecords,
    fetchVitalSigns,
  } = useData();

  return (
    <div>
      {/* Appointments */}
      <button onClick={() => fetchAppointments()}>Fetch Appointments</button>
      {loading.appointments && <div>Loading appointments...</div>}
      {error.appointments && <div data-testid="appointments-error">{error.appointments}</div>}
      {data.appointments?.map((appointment) => (
        <div key={appointment.id} data-testid="appointment-item">
          {appointment.appointment_type}
        </div>
      ))}

      {/* Medical Records */}
      <button onClick={() => fetchMedicalRecords()}>Fetch Medical Records</button>
      {loading.medicalRecords && <div>Loading medical records...</div>}
      {error.medicalRecords && <div data-testid="records-error">{error.medicalRecords}</div>}
      {data.medicalRecords?.map((record) => (
        <div key={record.id} data-testid="record-item">
          {record.type}
        </div>
      ))}

      {/* Vital Signs */}
      <button onClick={() => fetchVitalSigns()}>Fetch Vital Signs</button>
      {loading.vitalSigns && <div>Loading vital signs...</div>}
      {error.vitalSigns && <div data-testid="vitals-error">{error.vitalSigns}</div>}
      {data.vitalSigns?.map((vital) => (
        <div key={vital.id} data-testid="vital-item">
          {vital.type}
        </div>
      ))}
    </div>
  );
};

describe('DataContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial data state', () => {
    render(<TestComponent />);
    expect(screen.queryByTestId('appointment-item')).not.toBeInTheDocument();
    expect(screen.queryByTestId('record-item')).not.toBeInTheDocument();
    expect(screen.queryByTestId('vital-item')).not.toBeInTheDocument();
  });

  it('fetches appointments successfully', async () => {
    healthApi.fetchAppointments.mockResolvedValueOnce({ data: mockAppointments });

    render(<TestComponent />);

    // Click fetch appointments button
    await act(async () => {
      screen.getByRole('button', { name: /fetch appointments/i }).click();
    });

    // Wait for appointments to be displayed
    await waitFor(() => {
      expect(screen.getAllByTestId('appointment-item')).toHaveLength(mockAppointments.length);
    });
  });

  it('handles appointment fetch error', async () => {
    const errorMessage = 'Failed to fetch appointments';
    healthApi.fetchAppointments.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    render(<TestComponent />);

    // Click fetch appointments button
    await act(async () => {
      screen.getByRole('button', { name: /fetch appointments/i }).click();
    });

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('appointments-error')).toHaveTextContent(errorMessage);
    });
  });

  it('fetches medical records successfully', async () => {
    healthApi.fetchMedicalRecords.mockResolvedValueOnce({ data: mockMedicalRecords });

    render(<TestComponent />);

    // Click fetch medical records button
    await act(async () => {
      screen.getByRole('button', { name: /fetch medical records/i }).click();
    });

    // Wait for medical records to be displayed
    await waitFor(() => {
      expect(screen.getAllByTestId('record-item')).toHaveLength(mockMedicalRecords.length);
    });
  });

  it('fetches vital signs successfully', async () => {
    healthApi.fetchVitalSigns.mockResolvedValueOnce({ data: mockVitalSigns });

    render(<TestComponent />);

    // Click fetch vital signs button
    await act(async () => {
      screen.getByRole('button', { name: /fetch vital signs/i }).click();
    });

    // Wait for vital signs to be displayed
    await waitFor(() => {
      expect(screen.getAllByTestId('vital-item')).toHaveLength(mockVitalSigns.length);
    });
  });

  it('handles concurrent data fetching', async () => {
    healthApi.fetchAppointments.mockResolvedValueOnce({ data: mockAppointments });
    healthApi.fetchMedicalRecords.mockResolvedValueOnce({ data: mockMedicalRecords });
    healthApi.fetchVitalSigns.mockResolvedValueOnce({ data: mockVitalSigns });

    render(<TestComponent />);

    // Click all fetch buttons
    await act(async () => {
      screen.getByRole('button', { name: /fetch appointments/i }).click();
      screen.getByRole('button', { name: /fetch medical records/i }).click();
      screen.getByRole('button', { name: /fetch vital signs/i }).click();
    });

    // Wait for all data to be displayed
    await waitFor(() => {
      expect(screen.getAllByTestId('appointment-item')).toHaveLength(mockAppointments.length);
      expect(screen.getAllByTestId('record-item')).toHaveLength(mockMedicalRecords.length);
      expect(screen.getAllByTestId('vital-item')).toHaveLength(mockVitalSigns.length);
    });
  });
});
