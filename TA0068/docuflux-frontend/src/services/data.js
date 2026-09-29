// ─── DocuFlux Data Service — Real API Layer ──────────────────────────────────
// All functions call the live backend. Auth token is injected automatically.

import api from './api';

// ─── Cases ───────────────────────────────────────────────────────────────────

/**
 * Get all cases for the currently logged-in user (Doctor or Patient).
 * Doctor: sees cases they created (with consent-filtered data).
 * Patient: sees all their own cases.
 */
export const getCases = async () => {
    const response = await api.get('/cases');
    return response.data;
};

/**
 * Process a transcript with the AI engine.
 * Returns structured { diagnosis, symptoms, medicines, advice }.
 * Falls back to smart keyword parser if no OpenRouter key is configured.
 */
export const processTranscript = async (transcript) => {
    const response = await api.post('/cases/process', { transcript });
    return response.data;
};

/**
 * Save a finalized case to the database.
 * Requires an approved consent for the patient.
 */
export const saveCase = async (caseData) => {
    const response = await api.post('/cases', caseData);
    return response.data;
};

/**
 * Mark a case as Completed or revert to Active.
 */
export const updateCaseStatus = async (id, status) => {
    const response = await api.put(`/cases/${id}/status`, { status });
    return response.data;
};

// ─── Consent ─────────────────────────────────────────────────────────────────

/**
 * Doctor requests consent from a patient using their short ID (6+ chars)
 * or full MongoDB ObjectId.
 * Returns the consent object: { _id, patientId: { _id, name, email }, status, ... }
 */
export const requestConsent = async (patientId) => {
    const response = await api.post('/consent/request', { patientId });
    return response.data;
};

/**
 * Check the status of a specific consent by its ID.
 * Returns consent object with current status.
 */
export const checkConsentStatus = async (consentId) => {
    const response = await api.get(`/consent/${consentId}`);
    return response.data;
};

/**
 * Patient approves a consent request with selected data fields.
 */
export const approveConsent = async (id, allowedFields) => {
    const response = await api.put(`/consent/${id}/approve`, { allowedFields });
    return response.data;
};

/**
 * Patient denies a consent request.
 */
export const denyConsent = async (id) => {
    const response = await api.put(`/consent/${id}/deny`);
    return response.data;
};

/**
 * Get all consent requests for the currently logged-in patient.
 */
export const getPatientConsentRequests = async () => {
    const response = await api.get('/consent/patient');
    return response.data;
};

/**
 * Get all consent connections & requests for the currently logged-in doctor.
 */
export const getDoctorConsentRequests = async () => {
    const response = await api.get('/consent/doctor');
    return response.data;
};

// ─── Users & Profiles ────────────────────────────────────────────────────────

/**
 * Search for patients by short ID suffix, name, or email.
 * Only callable by Doctors.
 */
export const searchPatients = async (query) => {
    const response = await api.get(`/users/patients?q=${encodeURIComponent(query)}`);
    return response.data;
};

/**
 * Search and rank doctors based on symptoms and optional city.
 * Returns { doctors: [...], matchedSpecialties: [...] }
 */
export const searchDoctors = async (symptoms = '', city = '') => {
    const params = new URLSearchParams();
    if (symptoms) params.append('symptoms', symptoms);
    if (city) params.append('city', city);
    const response = await api.get(`/users/doctors?${params.toString()}`);
    return response.data;
};

/**
 * Get the currently logged-in user's full profile details.
 */
export const getUserProfile = async () => {
    const response = await api.get('/users/me');
    return response.data;
};

/**
 * Update the currently logged-in user's profile.
 */
export const updateUserProfile = async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
};

// ─── Patient-Initiated Doctor Connection ──────────────────────────────────────

/**
 * Patient initiates a consultation / direct consent authorization to a doctor.
 */
export const requestConsultationWithDoctor = async (doctorId) => {
    const response = await api.post('/consent/patient-request', { doctorId });
    return response.data;
};

// ─── Personal Medical Records ────────────────────────────────────────────────

/**
 * Get all personal medical records for the logged-in patient (without bulky fileData).
 */
export const getMedicalRecords = async () => {
    const response = await api.get('/records');
    return response.data;
};

/**
 * Get a single medical record with fileData (base64) for viewing/download.
 */
export const getMedicalRecordById = async (id) => {
    const response = await api.get(`/records/${id}`);
    return response.data;
};

/**
 * Upload a personal medical record (PDF, image, etc. in base64).
 */
export const uploadMedicalRecord = async (recordData) => {
    const response = await api.post('/records', recordData);
    return response.data;
};

/**
 * Delete a personal medical record by ID.
 */
export const deleteMedicalRecord = async (id) => {
    const response = await api.delete(`/records/${id}`);
    return response.data;
};

/**
 * Doctor views a patient's records (requires approved consent or case relationship).
 */
export const getPatientMedicalRecords = async (patientId) => {
    const response = await api.get(`/records/patient/${patientId}`);
    return response.data;
};

/**
 * Doctor views a patient's full medical profile (requires approved consent or case relationship).
 */
export const getPatientProfileById = async (patientId) => {
    const response = await api.get(`/users/patients/${patientId}`);
    return response.data;
};





