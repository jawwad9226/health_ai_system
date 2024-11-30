import React from 'react';
import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
    allergies: '',
    emergency_contact: '',
    height: '',
    weight: '',
    insurance_info: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/profile');
      if (response.data) {
        const profileData = {
          ...formData,
          ...response.data
        };
        setProfile(profileData);
        setFormData(profileData);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await api.put('/api/profile', formData);
      setProfile(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Profile Information
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    disabled={!isEditing}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    disabled={!isEditing}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    disabled={!isEditing}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    id="date_of_birth"
                    disabled={!isEditing}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    disabled={!isEditing}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="blood_type" className="block text-sm font-medium text-gray-700">
                    Blood Type
                  </label>
                  <select
                    id="blood_type"
                    name="blood_type"
                    disabled={!isEditing}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={formData.blood_type}
                    onChange={handleInputChange}
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                    Allergies
                  </label>
                  <textarea
                    id="allergies"
                    name="allergies"
                    rows={2}
                    disabled={!isEditing}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    placeholder="List any allergies..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">
                    Emergency Contact
                  </label>
                  <textarea
                    id="emergency_contact"
                    name="emergency_contact"
                    rows={2}
                    disabled={!isEditing}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.emergency_contact}
                    onChange={handleInputChange}
                    placeholder="Name and contact information..."
                  />
                </div>

                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    id="height"
                    disabled={!isEditing}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.height}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    id="weight"
                    disabled={!isEditing}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.weight}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="insurance_info" className="block text-sm font-medium text-gray-700">
                    Insurance Information
                  </label>
                  <textarea
                    id="insurance_info"
                    name="insurance_info"
                    rows={2}
                    disabled={!isEditing}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.insurance_info}
                    onChange={handleInputChange}
                    placeholder="Insurance provider and policy number..."
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(profile);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
