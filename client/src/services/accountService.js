import apiClient from './api';

/**
 * Download a JSON copy of the authenticated user's personal data.
 */
export const downloadAccountExport = async () => {
  try {
    const response = await apiClient.get('/account/export', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edusetu-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Could not download your data';
    return { success: false, error: message };
  }
};

/**
 * Permanently delete the authenticated account after password and phrase confirmation.
 */
export const deleteMyAccount = async ({ password, confirmation }) => {
  try {
    const response = await apiClient.delete('/account', { data: { password, confirmation } });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Could not delete your account';
    return { success: false, error: message };
  }
};
