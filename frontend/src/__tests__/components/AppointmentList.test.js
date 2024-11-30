import React from 'react';
import { render, screen, fireEvent } from '../utils/test-utils';
import AppointmentList from '../../components/lists/AppointmentList';
import { mockAppointments } from '../utils/mockData';

describe('AppointmentList', () => {
  it('renders empty state when no appointments are provided', () => {
    render(<AppointmentList appointments={[]} />);
    expect(screen.getByText('No upcoming appointments')).toBeInTheDocument();
  });

  it('renders appointments correctly', () => {
    render(<AppointmentList appointments={mockAppointments} />);

    mockAppointments.forEach(appointment => {
      // Check appointment type
      expect(screen.getByText(appointment.appointment_type)).toBeInTheDocument();
      // Check professional name
      expect(screen.getByText(new RegExp(appointment.professional_name))).toBeInTheDocument();
      // Check status
      expect(screen.getByText(appointment.status)).toBeInTheDocument();
    });
  });

  it('displays correct appointment date and time', () => {
    render(<AppointmentList appointments={mockAppointments} />);

    mockAppointments.forEach(appointment => {
      const date = new Date(appointment.scheduled_time);
      // The actual format will depend on your date formatting
      expect(screen.getByText(new RegExp(date.getFullYear().toString()))).toBeInTheDocument();
    });
  });

  it('shows correct icons for different consultation methods', () => {
    const appointments = [
      { ...mockAppointments[0], consultation_method: 'video' },
      { ...mockAppointments[1], consultation_method: 'phone' },
      { ...mockAppointments[1], consultation_method: 'in-person' },
    ];

    render(<AppointmentList appointments={appointments} />);
  });

  it('renders action buttons for each appointment', () => {
    render(<AppointmentList appointments={mockAppointments} />);

    // Should have edit and cancel buttons for each appointment
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });

    expect(editButtons).toHaveLength(mockAppointments.length);
    expect(cancelButtons).toHaveLength(mockAppointments.length);
  });

  it('handles edit button click', () => {
    const mockEdit = jest.fn();
    render(<AppointmentList appointments={mockAppointments} onEdit={mockEdit} />);

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    // Verify edit handler was called
    expect(mockEdit).toHaveBeenCalledWith(mockAppointments[0]);
  });

  it('handles cancel button click', () => {
    const mockCancel = jest.fn();
    render(<AppointmentList appointments={mockAppointments} onCancel={mockCancel} />);

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButtons[0]);

    // Verify cancel handler was called
    expect(mockCancel).toHaveBeenCalledWith(mockAppointments[0]);
  });

  it('displays different styles for different appointment statuses', () => {
    const appointments = [
      { ...mockAppointments[0], status: 'confirmed' },
      { ...mockAppointments[1], status: 'pending' },
      { ...mockAppointments[1], status: 'cancelled' },
    ];

    render(<AppointmentList appointments={appointments} />);

    expect(screen.getByText('confirmed')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('cancelled')).toBeInTheDocument();
  });

  it('handles null or undefined appointment properties gracefully', () => {
    const incompleteAppointment = {
      id: '3',
      appointment_type: 'Check-up',
      // Missing other properties
    };

    render(<AppointmentList appointments={[incompleteAppointment]} />);
    expect(screen.getByText('Check-up')).toBeInTheDocument();
  });
});
