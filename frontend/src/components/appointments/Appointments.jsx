import { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    doctor: '',
    specialty: '',
    date: '',
    time: '',
    reason: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/appointments', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAppointments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAppointment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/appointments', newAppointment, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNewAppointment({
        doctor: '',
        specialty: '',
        date: '',
        time: '',
        reason: ''
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      setError('Failed to schedule appointment');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Appointments</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Schedule and manage your medical appointments</p>
          </div>

          {/* Schedule New Appointment Form */}
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
                    Doctor
                  </label>
                  <input
                    type="text"
                    name="doctor"
                    id="doctor"
                    value={newAppointment.doctor}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                    Specialty
                  </label>
                  <input
                    type="text"
                    name="specialty"
                    id="specialty"
                    value={newAppointment.specialty}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    id="date"
                    value={newAppointment.date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    id="time"
                    value={newAppointment.time}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Reason for Visit
                  </label>
                  <textarea
                    name="reason"
                    id="reason"
                    rows={3}
                    value={newAppointment.reason}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>

          {/* Upcoming Appointments */}
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Upcoming Appointments</h4>
            <div className="space-y-4">
              {appointments.map((appointment, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <CalendarIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">
                          Dr. {appointment.doctor}
                        </h5>
                        <p className="text-sm text-gray-500">{appointment.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <ClockIcon className="h-5 w-5" />
                      <span>
                        {new Date(appointment.date).toLocaleDateString()} at{' '}
                        {new Date(appointment.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">{appointment.reason}</p>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="text-center text-gray-500">No upcoming appointments</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
