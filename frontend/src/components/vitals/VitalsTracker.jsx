import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function VitalsTracker() {
  const [vitals, setVitals] = useState([]);
  const [newVital, setNewVital] = useState({
    heart_rate: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    oxygen_saturation: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVitals();
  }, []);

  const fetchVitals = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vitals', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setVitals(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vitals:', error);
      setError('Failed to load vitals data');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVital(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/vitals', newVital, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNewVital({
        heart_rate: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        temperature: '',
        oxygen_saturation: ''
      });
      fetchVitals();
    } catch (error) {
      console.error('Error recording vitals:', error);
      setError('Failed to record vitals');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Vitals Tracker</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Record and monitor your vital signs</p>
          </div>

          {/* Record New Vitals Form */}
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="heart_rate" className="block text-sm font-medium text-gray-700">
                    Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    name="heart_rate"
                    id="heart_rate"
                    value={newVital.heart_rate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="blood_pressure_systolic" className="block text-sm font-medium text-gray-700">
                    Blood Pressure (Systolic)
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_systolic"
                    id="blood_pressure_systolic"
                    value={newVital.blood_pressure_systolic}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="blood_pressure_diastolic" className="block text-sm font-medium text-gray-700">
                    Blood Pressure (Diastolic)
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_diastolic"
                    id="blood_pressure_diastolic"
                    value={newVital.blood_pressure_diastolic}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    id="temperature"
                    value={newVital.temperature}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="oxygen_saturation" className="block text-sm font-medium text-gray-700">
                    Oxygen Saturation (%)
                  </label>
                  <input
                    type="number"
                    name="oxygen_saturation"
                    id="oxygen_saturation"
                    value={newVital.oxygen_saturation}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Record Vitals
                </button>
              </div>
            </form>
          </div>

          {/* Vitals History Chart */}
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Vitals History</h4>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vitals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="heart_rate"
                    stroke="#8884d8"
                    name="Heart Rate"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="oxygen_saturation"
                    stroke="#82ca9d"
                    name="Oxygen Saturation"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Vitals Table */}
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Measurements</h4>
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Heart Rate
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Blood Pressure
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Temperature
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            O2 Saturation
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vitals.map((vital, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(vital.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vital.heart_rate} BPM
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vital.temperature}°F
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vital.oxygen_saturation}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
