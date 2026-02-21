import axios from 'axios';

const API_URL = '/api';

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('userInfo'));
  return { headers: { Authorization: `Bearer ${user.token}` } };
};

// Case Services
export const getCases = async () => {
  const response = await axios.get(`${API_URL}/cases`, getAuthHeader());
  return response.data;
};

export const processTranscript = async (transcript) => {
  const response = await axios.post(`${API_URL}/cases/process`, { transcript }, getAuthHeader());
  return response.data;
};

export const saveCase = async (caseData) => {
  const response = await axios.post(`${API_URL}/cases`, caseData, getAuthHeader());
  return response.data;
};

// Consent Services
export const getPatientConsentRequests = async () => {
  const response = await axios.get(`${API_URL}/consent/patient`, getAuthHeader());
  return response.data;
};

export const approveConsent = async (id, allowedFields) => {
  const response = await axios.put(`${API_URL}/consent/${id}/approve`, { allowedFields }, getAuthHeader());
  return response.data;
};

export const requestConsent = async (patientId) => {
  const response = await axios.post(`${API_URL}/consent/request`, { patientId }, getAuthHeader());
  return response.data;
};
