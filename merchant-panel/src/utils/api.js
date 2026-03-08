// Centralized API configuration
// Point to the admin backend server
const getApiUrl = () => {
  // Use environment variable or default to admin backend URL
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  return apiUrl;
};

export const API_URL = getApiUrl();

// Helper to get full URL for uploaded files
export const getFileUrl = (path) => {
  if (!path) return null;
  // If it's already a full URL or base64, return as is
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }
  // Otherwise, prepend the API URL
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return `${baseUrl}${path}`;
};

export default API_URL;
