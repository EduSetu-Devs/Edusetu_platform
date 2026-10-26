import apiClient from './api';

export const getSchoolProfile = async () => {
  try {
    const response = await apiClient.get('/school/profile');
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch school profile'
    };
  }
};

export const saveSchoolProfile = async (profileData) => {
  try {
    const response = await apiClient.post('/school/profile', profileData);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to save school profile'
    };
  }
};

export const searchSchoolTutors = async (params = {}) => {
  try {
    const response = await apiClient.get('/school/tutors', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to search candidate faculty'
    };
  }
};
