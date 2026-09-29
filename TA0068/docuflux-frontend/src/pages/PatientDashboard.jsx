import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    getPatientConsentRequests, approveConsent, denyConsent, getCases,
    searchDoctors, getUserProfile, updateUserProfile,
    getMedicalRecords, getMedicalRecordById, uploadMedicalRecord, deleteMedicalRecord,
    requestConsultationWithDoctor
} from '../services/data';
import {
    Shield, History, Check, User, FileText, Clock, Calendar,
    Clipboard, Pill, MessageSquare, Image as ImageIcon, ChevronDown,
    ChevronUp, Activity, ArrowRight, Fingerprint, Lock, X, Loader2,
    Copy, CheckCircle2, AlertCircle, Search, UploadCloud, Trash2,
    File, Download, Eye, Heart, Stethoscope, MapPin, Sparkles,
    Plus, ExternalLink, ShieldCheck, Save, Phone, HeartPulse, Filter,
    CheckCircle, AlertTriangle
} from 'lucide-react';

const PatientDashboard = () => {
    // ─── Active Tab State ────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('vault'); // 'vault' | 'find-doctor' | 'records' | 'profile'

    // ─── Shared / Vault State ───────────────────────────────────────────────────
    const [requests, setRequests] = useState([]);
    const [cases, setCases] = useState([]);
    const [loadingVault, setLoadingVault] = useState(true);
    const [expandedCase, setExpandedCase] = useState(null);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [activeRequest, setActiveRequest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState(null);

    const [selectedFields, setSelectedFields] = useState({
        diagnosis: true,
        medicines: true,
        advice: true,
        prescriptionImage: true,
        resolutionNotes: true,
        pastRecords: true,
        patientProfile: true,
    });

    const availableFields = [
        { id: 'diagnosis', label: 'Clinical Diagnosis', icon: Clipboard, desc: 'Primary health findings' },
        { id: 'medicines', label: 'Medication Details', icon: Pill, desc: 'Dosage and frequency' },
        { id: 'advice', label: 'Lifestyle Advice', icon: MessageSquare, desc: 'Doctor recommendations' },
        { id: 'prescriptionImage', label: 'Clinical Scans', icon: ImageIcon, desc: 'Images and physical RX' },
        { id: 'resolutionNotes', label: 'Outcome Summary', icon: FileText, desc: 'Treatment resolution' },
        { id: 'pastRecords', label: 'Past Medical Records & Scans', icon: UploadCloud, desc: 'Your uploaded reports, X-rays & history' },
        { id: 'patientProfile', label: 'Medical Profile & Vitals', icon: User, desc: 'Allergies, conditions, and contacts' },
    ];

    const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ─── Fetch Vault Data ────────────────────────────────────────────────────────
    const fetchVaultData = useCallback(async () => {
        try {
            setLoadingVault(true);
            const [reqs, history] = await Promise.all([
                getPatientConsentRequests(),
                getCases(),
            ]);
            setRequests(reqs || []);
            setCases(history || []);
        } catch (err) {
            console.error('Failed to sync vault data:', err.response?.data?.message || err.message);
        } finally {
            setLoadingVault(false);
        }
    }, []);

    useEffect(() => {
        fetchVaultData();
    }, [fetchVaultData]);

    const copyId = () => {
        if (userInfo._id) {
            navigator.clipboard.writeText(userInfo._id.slice(-6));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'Pending');
    const approvedConnections = requests.filter(r => r.status === 'Approved').length;

    // Consent modal handlers
    const openApproveModal = (req) => {
        setActiveRequest(req);
        setSelectedFields({
            diagnosis: true,
            medicines: true,
            advice: true,
            prescriptionImage: true,
            resolutionNotes: true,
            pastRecords: true,
            patientProfile: true,
        });
        setShowConsentModal(true);
    };

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            const allowedFields = Object.keys(selectedFields).filter(k => selectedFields[k]);
            await approveConsent(activeRequest._id, allowedFields);
            setShowConsentModal(false);
            showToast('✓ Access granted to Dr. ' + (activeRequest.doctorId?.name || 'Doctor'));
            fetchVaultData();
        } catch (err) {
            showToast('Failed to approve: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeny = async (reqId) => {
        try {
            setActionLoading(true);
            await denyConsent(reqId);
            setShowConsentModal(false);
            showToast('Access request denied.', 'info');
            fetchVaultData();
        } catch (err) {
            showToast('Failed to deny: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleField = (field) => setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));

    // ─── TAB 2: FIND DOCTORS STATE & HANDLERS ────────────────────────────────────
    const [symptomQuery, setSymptomQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [matchedSpecialties, setMatchedSpecialties] = useState([]);
    const [searchingDoctors, setSearchingDoctors] = useState(false);
    const [connectingDoctorId, setConnectingDoctorId] = useState(null);
    const [connectedDoctors, setConnectedDoctors] = useState(new Set());

    const handleSearchDoctors = useCallback(async (query = symptomQuery, city = cityFilter) => {
        try {
            setSearchingDoctors(true);
            const res = await searchDoctors(query, city);
            setDoctors(res.doctors || []);
            setMatchedSpecialties(res.matchedSpecialties || []);
        } catch (err) {
            console.error('Doctor search error:', err);
            showToast('Failed to find doctors: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setSearchingDoctors(false);
        }
    }, [symptomQuery, cityFilter]);

    // Initial search when switching to Find Doctor tab
    useEffect(() => {
        if (activeTab === 'find-doctor' && doctors.length === 0) {
            handleSearchDoctors('', userInfo?.city || '');
        }
    }, [activeTab, doctors.length, handleSearchDoctors, userInfo?.city]);

    const handleConnectDoctor = async (doctor) => {
        try {
            setConnectingDoctorId(doctor._id);
            await requestConsultationWithDoctor(doctor._id);
            setConnectedDoctors(prev => new Set(prev).add(doctor._id));
            showToast(`✓ Consultation requested with Dr. ${doctor.name}! Access authorized.`);
            fetchVaultData(); // refresh connections
        } catch (err) {
            showToast('Connection failed: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setConnectingDoctorId(null);
        }
    };

    // ─── TAB 3: MEDICAL RECORDS STATE & HANDLERS ─────────────────────────────────
    const [records, setRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [recordCategoryFilter, setRecordCategoryFilter] = useState('All');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [viewingRecord, setViewingRecord] = useState(null);
    const [loadingRecordDetail, setLoadingRecordDetail] = useState(false);
    const [uploadingRecord, setUploadingRecord] = useState(false);
    const [deletingRecordId, setDeletingRecordId] = useState(null);

    // Upload form state
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadCategory, setUploadCategory] = useState('Lab Report');
    const [uploadNotes, setUploadNotes] = useState('');
    const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadFilePreview, setUploadFilePreview] = useState(null);
    const [uploadError, setUploadError] = useState('');

    const fetchRecords = useCallback(async () => {
        try {
            setLoadingRecords(true);
            const data = await getMedicalRecords();
            setRecords(data || []);
        } catch (err) {
            console.error('Failed to load records:', err);
        } finally {
            setLoadingRecords(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'records') {
            fetchRecords();
        }
    }, [activeTab, fetchRecords]);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File exceeds 5MB limit. Please choose a smaller file.');
            return;
        }

        setUploadError('');
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadFile({
                base64: reader.result,
                name: file.name,
                type: file.type,
                size: file.size,
            });
            if (file.type.startsWith('image/')) {
                setUploadFilePreview(reader.result);
            } else {
                setUploadFilePreview(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadTitle.trim()) {
            setUploadError('Please provide a title for the document.');
            return;
        }

        try {
            setUploadingRecord(true);
            setUploadError('');
            await uploadMedicalRecord({
                title: uploadTitle,
                category: uploadCategory,
                notes: uploadNotes,
                recordDate: uploadDate,
                fileData: uploadFile?.base64,
                fileName: uploadFile?.name,
                fileType: uploadFile?.type,
            });

            showToast('✓ Medical record saved successfully!');
            setShowUploadModal(false);
            // Reset form
            setUploadTitle('');
            setUploadCategory('Lab Report');
            setUploadNotes('');
            setUploadFile(null);
            setUploadFilePreview(null);
            fetchRecords();
        } catch (err) {
            setUploadError(err.response?.data?.message || 'Failed to upload document.');
        } finally {
            setUploadingRecord(false);
        }
    };

    const handleViewRecord = async (recordId) => {
        try {
            setLoadingRecordDetail(true);
            const fullRecord = await getMedicalRecordById(recordId);
            setViewingRecord(fullRecord);
        } catch (err) {
            showToast('Failed to open document: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setLoadingRecordDetail(false);
        }
    };

    const handleDeleteRecord = async (recordId, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to permanently delete this document?')) return;
        try {
            setDeletingRecordId(recordId);
            await deleteMedicalRecord(recordId);
            showToast('Document deleted.', 'info');
            if (viewingRecord?._id === recordId) setViewingRecord(null);
            fetchRecords();
        } catch (err) {
            showToast('Failed to delete: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setDeletingRecordId(null);
        }
    };

    const filteredRecords = useMemo(() => {
        if (recordCategoryFilter === 'All') return records;
        return records.filter(r => r.category === recordCategoryFilter);
    }, [records, recordCategoryFilter]);

    // ─── TAB 4: PROFILE STATE & HANDLERS ─────────────────────────────────────────
    const [profile, setProfile] = useState({
        name: userInfo?.name || '',
        email: userInfo?.email || '',
        phoneNumber: '',
        gender: '',
        dateOfBirth: '',
        bloodGroup: '',
        city: userInfo?.city || '',
        allergies: '',
        chronicConditions: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
    });
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            setLoadingProfile(true);
            const user = await getUserProfile();
            if (user) {
                setProfile({
                    name: user.name || '',
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || '',
                    gender: user.gender || '',
                    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
                    bloodGroup: user.bloodGroup || '',
                    city: user.city || '',
                    allergies: user.allergies || '',
                    chronicConditions: user.chronicConditions || '',
                    emergencyContactName: user.emergencyContactName || '',
                    emergencyContactPhone: user.emergencyContactPhone || '',
                });
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'profile') {
            fetchProfile();
        }
    }, [activeTab, fetchProfile]);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        try {
            setSavingProfile(true);
            const updated = await updateUserProfile(profile);
            // Update local sessionStorage userInfo copy if needed
            const stored = JSON.parse(sessionStorage.getItem('userInfo')) || {};
            sessionStorage.setItem('userInfo', JSON.stringify({
                ...stored,
                name: updated.name,
                city: updated.city,
            }));
            showToast('✓ Profile updated successfully!');
        } catch (err) {
            showToast('Save failed: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setSavingProfile(false);
        }
    };

    // Calculate age from DOB
    const calculatedAge = useMemo(() => {
        if (!profile.dateOfBirth) return null;
        const birthDate = new Date(profile.dateOfBirth);
        const diff = Date.now() - birthDate.getTime();
        const ageDate = new Date(diff);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        return isNaN(age) ? null : age;
    }, [profile.dateOfBirth]);

    // Calculate profile completeness %
    const completenessScore = useMemo(() => {
        const requiredFields = [
            'name', 'phoneNumber', 'gender', 'dateOfBirth',
            'bloodGroup', 'city', 'allergies', 'chronicConditions',
            'emergencyContactName', 'emergencyContactPhone'
        ];
        const filled = requiredFields.filter(f => profile[f] && String(profile[f]).trim().length > 0).length;
        return Math.round((filled / requiredFields.length) * 100);
    }, [profile]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-16 space-y-10 selection:bg-indigo-100 selection:text-indigo-900">

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-24 right-6 z-[300] px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl animate-slide-up-fade flex items-center gap-3 ${
                    toast.type === 'error' ? 'bg-rose-500 text-white' :
                    toast.type === 'info' ? 'bg-slate-800 text-white' :
                    'bg-emerald-600 text-white'
                }`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* ─── Top Header Section ─── */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-slate-100">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-black uppercase tracking-wider">
                        <Fingerprint className="w-3.5 h-3.5" /> E2EE Health Identity Verified
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight font-outfit">
                        {activeTab === 'vault' && 'Clinical Vault'}
                        {activeTab === 'find-doctor' && 'Smart Doctor Discovery'}
                        {activeTab === 'records' && 'Personal Medical Records'}
                        {activeTab === 'profile' && 'Patient Medical Profile'}
                    </h1>
                    <p className="text-slate-500 font-medium text-base">
                        Authenticated as <strong className="text-slate-800 font-bold">{userInfo?.name || 'Patient'}</strong>
                        {profile.city ? ` • ${profile.city}` : ''}
                    </p>
                </div>

                {/* Health ID Badge & Peers */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="inline-flex items-center gap-3 bg-white border border-slate-200/80 shadow-sm rounded-2xl px-4 py-2.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Health ID</span>
                        <span className="font-mono font-black text-indigo-600 text-base">#{userInfo?._id?.slice(-6) || '------'}</span>
                        <button
                            onClick={copyId}
                            className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-400 transition"
                            title="Copy ID to share with your doctor"
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <Shield className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Peers</p>
                            <p className="text-xs font-bold text-slate-800">{approvedConnections} Connected</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── Modern 4-Tab Navigation Bar ─── */}
            <nav className="flex p-1.5 bg-slate-100/90 backdrop-blur-md rounded-2xl border border-slate-200/60 overflow-x-auto shadow-inner">
                <button
                    onClick={() => setActiveTab('vault')}
                    className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 ${
                        activeTab === 'vault'
                            ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50 scale-[1.01]'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                >
                    <History className="w-4 h-4" />
                    <span>Clinical Vault</span>
                    {pendingRequests.length > 0 && (
                        <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-black animate-pulse">
                            {pendingRequests.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('find-doctor')}
                    className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 ${
                        activeTab === 'find-doctor'
                            ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50 scale-[1.01]'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                >
                    <Stethoscope className="w-4 h-4" />
                    <span>Find Doctor</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black uppercase tracking-wider">AI Map</span>
                </button>

                <button
                    onClick={() => setActiveTab('records')}
                    className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 ${
                        activeTab === 'records'
                            ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50 scale-[1.01]'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                >
                    <UploadCloud className="w-4 h-4" />
                    <span>My Past Records</span>
                    {records.length > 0 && (
                        <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-md text-[10px] font-bold">
                            {records.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 min-w-[140px] py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 ${
                        activeTab === 'profile'
                            ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50 scale-[1.01]'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                    }`}
                >
                    <User className="w-4 h-4" />
                    <span>My Medical Profile</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        completenessScore >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                        {completenessScore}%
                    </span>
                </button>
            </nav>

            {/* ─── TAB 1: CLINICAL VAULT ─── */}
            {activeTab === 'vault' && (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 animate-fade-in">
                    {/* Privacy Controls Column */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-indigo-500" /> Peer Authorization
                            </h2>
                            {pendingRequests.length > 0 && (
                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full">
                                    Action Required
                                </span>
                            )}
                        </div>

                        {loadingVault ? (
                            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                            </div>
                        ) : pendingRequests.length > 0 ? (
                            <div className="space-y-4">
                                {pendingRequests.map((req) => (
                                    <div key={req._id} className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block mb-4">Doctor Access Request</span>
                                        <div className="flex items-center gap-3.5 mb-6">
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-lg border border-white/20">
                                                {req.doctorId?.name?.charAt(0) || 'D'}
                                            </div>
                                            <div>
                                                <p className="text-base font-bold">Dr. {req.doctorId?.name}</p>
                                                <p className="text-xs text-indigo-200">{req.doctorId?.specialization || req.doctorId?.email}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <button
                                                onClick={() => openApproveModal(req)}
                                                className="w-full bg-white text-indigo-700 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition shadow-sm"
                                            >
                                                Review & Authorize
                                            </button>
                                            <button
                                                onClick={() => handleDeny(req._id)}
                                                disabled={actionLoading}
                                                className="w-full border border-white/30 text-white/80 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition disabled:opacity-50"
                                            >
                                                {actionLoading ? 'Processing...' : 'Deny Access'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-3 shadow-sm">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <p className="text-slate-600 font-bold text-sm">Vault is Locked & Private</p>
                                <p className="text-slate-400 text-xs leading-relaxed">No pending access requests. Doctors must request access before decoding records.</p>
                            </div>
                        )}

                        {/* Security Info Card */}
                        <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-3 relative overflow-hidden">
                            <Activity className="absolute -right-4 -bottom-4 w-28 h-28 text-indigo-500/10" />
                            <div className="relative z-10 space-y-2">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-300">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Patient-Controlled Access
                                </h3>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Every consultation is encrypted. You decide which data nodes (prescriptions, diagnosis, advice) each doctor can inspect.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Consultation Feed Column */}
                    <div className="xl:col-span-3 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <History className="w-3.5 h-3.5 text-teal-500" /> Physician Consultations ({cases.length})
                            </h2>
                        </div>

                        {loadingVault ? (
                            <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-100">
                                <Loader2 className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
                                <p className="text-slate-400 font-medium text-sm">Decoding Encrypted Consultations...</p>
                            </div>
                        ) : cases.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-100 py-24 text-center space-y-4 px-6 shadow-sm">
                                <Clipboard className="w-16 h-16 text-slate-200 mx-auto" />
                                <h3 className="text-xl font-bold text-slate-700">No Doctor Consultations Yet</h3>
                                <p className="text-slate-400 text-sm max-w-md mx-auto">
                                    When your doctor conducts a DocuFlux consultation, your AI-scribed clinical records, prescriptions, and advice will appear here automatically.
                                </p>
                                <button
                                    onClick={() => setActiveTab('find-doctor')}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition"
                                >
                                    <Search className="w-4 h-4" /> Find a Doctor Now
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cases.map((c) => (
                                    <CaseCard
                                        key={c._id}
                                        c={c}
                                        isExpanded={expandedCase === c._id}
                                        onToggle={() => setExpandedCase(expandedCase === c._id ? null : c._id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── TAB 2: SMART DOCTOR DISCOVERY ─── */}
            {activeTab === 'find-doctor' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Search & Matching Card */}
                    <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-100 space-y-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-bold">
                                <Sparkles className="w-3.5 h-3.5" /> AI Symptom-to-Specialty Engine
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">How are you feeling today?</h2>
                            <p className="text-slate-500 text-sm">
                                Describe your symptoms naturally (e.g. <em>"feeling sick with cough and fever"</em> or <em>"sharp chest pain"</em>). DocuFlux matches you with the ideal verified specialists nearby.
                            </p>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearchDoctors(symptomQuery, cityFilter);
                            }}
                            className="grid grid-cols-1 md:grid-cols-12 gap-4"
                        >
                            <div className="md:col-span-7 relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <Search className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={symptomQuery}
                                    onChange={(e) => setSymptomQuery(e.target.value)}
                                    placeholder="Describe symptoms: chest pain, skin rash, headache, fever..."
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition text-slate-900 font-medium text-sm"
                                />
                            </div>

                            <div className="md:col-span-3 relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={cityFilter}
                                    onChange={(e) => setCityFilter(e.target.value)}
                                    placeholder="Filter city (e.g. London)"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition text-slate-900 font-medium text-sm"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={searchingDoctors}
                                    className="w-full h-full min-h-[52px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition disabled:opacity-50"
                                >
                                    {searchingDoctors ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <Search className="w-4 h-4" />
                                            <span>Find</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Matched Specialties Tags */}
                        {matchedSpecialties.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-400 mr-2">Identified Specialties:</span>
                                {matchedSpecialties.map((m, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold"
                                    >
                                        <Stethoscope className="w-3 h-3" />
                                        {m.specialty}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Doctor Cards Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Ranked Available Doctors ({doctors.length})
                            </h3>
                            {cityFilter && (
                                <span className="text-xs text-indigo-600 font-bold">
                                    Proximity boosted for: {cityFilter}
                                </span>
                            )}
                        </div>

                        {searchingDoctors ? (
                            <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-slate-100">
                                <Loader2 className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
                                <p className="text-slate-400 font-medium text-sm">Searching registered medical practitioners...</p>
                            </div>
                        ) : doctors.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-100 py-20 text-center space-y-3 shadow-sm">
                                <Stethoscope className="w-12 h-12 text-slate-200 mx-auto" />
                                <h4 className="text-lg font-bold text-slate-700">No Doctors Found</h4>
                                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                                    Try clearing your symptom keywords or expanding your city search.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {doctors.map((doc) => {
                                    const isConnected = connectedDoctors.has(doc._id) || requests.some(r => r.doctorId?._id === doc._id && r.status === 'Approved');
                                    const isPending = requests.some(r => r.doctorId?._id === doc._id && r.status === 'Pending');
                                    const isSameCity = cityFilter && doc.city && doc.city.toLowerCase() === cityFilter.toLowerCase();

                                    return (
                                        <div
                                            key={doc._id}
                                            className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col justify-between space-y-5"
                                        >
                                            <div className="space-y-4">
                                                {/* Header & Badges */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                                                        {doc.name?.charAt(0) || 'D'}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            Available
                                                        </span>
                                                        {isSameCity && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold">
                                                                <MapPin className="w-2.5 h-2.5" /> Nearby
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Doctor Info */}
                                                <div className="space-y-1.5">
                                                    <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                                                        Dr. {doc.name}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold">
                                                            {doc.specialization || 'General Physician'}
                                                        </span>
                                                        {doc.experience && (
                                                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                                {doc.experience}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {doc.qualifications && (
                                                        <p className="text-[11px] font-semibold text-slate-600">
                                                            🎓 {doc.qualifications}
                                                        </p>
                                                    )}

                                                    {doc.hospital && (
                                                        <p className="text-[11px] text-slate-500 font-medium">
                                                            🏥 {doc.hospital}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs pt-0.5">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        <span>{doc.city || 'Clinic location upon booking'}</span>
                                                    </div>
                                                </div>

                                                {doc.bio ? (
                                                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                                                        <p className="italic">"{doc.bio}"</p>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* Action Button */}
                                            <div className="pt-4 border-t border-slate-50">
                                                {isConnected ? (
                                                    <div className="w-full py-2.5 px-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                                        <CheckCircle className="w-4 h-4" /> Connected & Authorized
                                                    </div>
                                                ) : isPending ? (
                                                    <div className="w-full py-2.5 px-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                                        <Clock className="w-4 h-4" /> Request Pending
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleConnectDoctor(doc)}
                                                        disabled={connectingDoctorId === doc._id}
                                                        className="w-full py-3 px-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm hover:shadow-indigo-100 disabled:opacity-50"
                                                    >
                                                        {connectingDoctorId === doc._id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <HeartPulse className="w-4 h-4" />
                                                                <span>Request Consultation</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── TAB 3: PERSONAL MEDICAL RECORDS ─── */}
            {activeTab === 'records' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Header Banner & Upload Trigger */}
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl shadow-slate-200">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block">
                                Personal Health Document Repository
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                                Past Medical History & Artifacts
                            </h2>
                            <p className="text-slate-300 text-sm max-w-xl">
                                Upload your past blood tests, prescriptions, radiology scans (X-Ray/MRI), and vaccination certificates. Doctors you authorize can review them to understand your complete clinical background.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-6 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition shadow-lg shadow-indigo-500/30 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Upload Document</span>
                        </button>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {['All', 'Lab Report', 'Prescription', 'X-Ray', 'MRI', 'Vaccination', 'Doctor Note', 'Insurance', 'Other'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setRecordCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                    recordCategoryFilter === cat
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Records List / Grid */}
                    {loadingRecords ? (
                        <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-slate-100">
                            <Loader2 className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
                            <p className="text-slate-400 font-medium text-sm">Retrieving your encrypted past records...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100 py-24 text-center space-y-4 px-6 shadow-sm">
                            <UploadCloud className="w-16 h-16 text-slate-200 mx-auto" />
                            <h3 className="text-xl font-bold text-slate-700">No Past Records Found</h3>
                            <p className="text-slate-400 text-sm max-w-md mx-auto">
                                You haven't added any documents to this category yet. Uploading previous reports helps doctors make faster and safer clinical decisions.
                            </p>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition"
                            >
                                <Plus className="w-4 h-4" /> Upload First Document
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRecords.map((rec) => (
                                <div
                                    key={rec._id}
                                    onClick={() => handleViewRecord(rec._id)}
                                    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 transition duration-300 cursor-pointer flex flex-col justify-between space-y-4 group"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition">
                                                {rec.fileType?.startsWith('image/') ? (
                                                    <ImageIcon className="w-6 h-6" />
                                                ) : (
                                                    <FileText className="w-6 h-6" />
                                                )}
                                            </div>
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                                                {rec.category}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition tracking-tight">
                                                {rec.title}
                                            </h4>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{new Date(rec.recordDate || rec.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {rec.notes && (
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {rec.notes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-500">
                                        <span className="flex items-center gap-1.5 text-indigo-600 group-hover:underline">
                                            <Eye className="w-4 h-4" /> View Details
                                        </span>
                                        <button
                                            onClick={(e) => handleDeleteRecord(rec._id, e)}
                                            disabled={deletingRecordId === rec._id}
                                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                            title="Delete document"
                                        >
                                            {deletingRecordId === rec._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB 4: COMPLETE PATIENT PROFILE ─── */}
            {activeTab === 'profile' && (
                <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
                    {/* Completeness Card */}
                    <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Profile Health Completeness</h2>
                                <p className="text-xs text-slate-400">Complete profiles help emergency physicians provide accurate care.</p>
                            </div>
                            <span className="text-2xl font-black text-indigo-600 font-outfit">{completenessScore}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700 rounded-full"
                                style={{ width: `${completenessScore}%` }}
                            />
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleProfileSave} className="space-y-6">
                        {/* Personal Identification */}
                        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <User className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Personal Demographics</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email (Read Only)</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full px-4 py-3.5 bg-slate-100 border border-slate-200/60 rounded-2xl text-slate-500 font-medium text-sm cursor-not-allowed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={profile.phoneNumber}
                                        onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                                        placeholder="+1 234 567 8900"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">City / Region</label>
                                    <input
                                        type="text"
                                        value={profile.city}
                                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                        placeholder="e.g. New York, Karachi, London"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Gender</label>
                                    <select
                                        value={profile.gender}
                                        onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Non-Binary">Non-Binary</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center pr-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Date of Birth</label>
                                        {calculatedAge !== null && (
                                            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                Age: {calculatedAge} yrs
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="date"
                                        value={profile.dateOfBirth}
                                        onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Clinical Profile (Blood, Allergies, Chronic Conditions) */}
                        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Heart className="w-4 h-4 text-rose-500" />
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Clinical Vitals & Conditions</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Blood Group</label>
                                    <select
                                        value={profile.bloodGroup}
                                        onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    >
                                        <option value="">Select Blood Group</option>
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

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Known Allergies</label>
                                    <input
                                        type="text"
                                        value={profile.allergies}
                                        onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                                        placeholder="e.g. Penicillin, Peanuts, Sulfa (comma separated)"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Chronic Conditions / Ongoing Treatments</label>
                                    <textarea
                                        rows={2}
                                        value={profile.chronicConditions}
                                        onChange={(e) => setProfile({ ...profile, chronicConditions: e.target.value })}
                                        placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma, Thyroid..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Phone className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Emergency Contact</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Emergency Contact Name</label>
                                    <input
                                        type="text"
                                        value={profile.emergencyContactName}
                                        onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })}
                                        placeholder="e.g. Sarah Smith (Spouse)"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Emergency Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={profile.emergencyContactPhone}
                                        onChange={(e) => setProfile({ ...profile, emergencyContactPhone: e.target.value })}
                                        placeholder="+1 555 123 4567"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-indigo-100 transition transform hover:-translate-y-0.5 disabled:opacity-50"
                            >
                                {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>Save Profile Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ─── UPLOAD MEDICAL RECORD MODAL ─── */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up-fade max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Upload Past Medical Record</h3>
                                    <p className="text-xs text-slate-400">Supported: JPG, PNG, PDF, WebP (Max 5MB)</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="p-6 space-y-5 overflow-y-auto">
                            {uploadError && (
                                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-600">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{uploadError}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Title *</label>
                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    placeholder="e.g. Complete Blood Count (CBC) or Chest X-Ray"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                                    <select
                                        value={uploadCategory}
                                        onChange={(e) => setUploadCategory(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    >
                                        <option value="Lab Report">Lab Report</option>
                                        <option value="Prescription">Prescription</option>
                                        <option value="X-Ray">X-Ray</option>
                                        <option value="MRI">MRI</option>
                                        <option value="Vaccination">Vaccination</option>
                                        <option value="Doctor Note">Doctor Note</option>
                                        <option value="Insurance">Insurance</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Record</label>
                                    <input
                                        type="date"
                                        value={uploadDate}
                                        onChange={(e) => setUploadDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>
                            </div>

                            {/* File Upload Zone */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select File (Image / PDF)</label>
                                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-indigo-50/20 relative">
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileSelect}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    {uploadFile ? (
                                        <div className="space-y-2">
                                            {uploadFilePreview ? (
                                                <img src={uploadFilePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl mx-auto border border-slate-200" />
                                            ) : (
                                                <File className="w-12 h-12 text-indigo-500 mx-auto" />
                                            )}
                                            <p className="text-xs font-bold text-slate-800">{uploadFile.name}</p>
                                            <p className="text-[10px] text-slate-400">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <UploadCloud className="w-10 h-10 text-slate-300 mx-auto" />
                                            <p className="text-xs font-bold text-slate-700">Click or drag file here</p>
                                            <p className="text-[10px] text-slate-400">PNG, JPG, PDF up to 5MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes / Doctor Comments</label>
                                <textarea
                                    rows={2}
                                    value={uploadNotes}
                                    onChange={(e) => setUploadNotes(e.target.value)}
                                    placeholder="e.g. Prescribed by Dr. Adams after ankle fracture in 2024..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadingRecord}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-50"
                                >
                                    {uploadingRecord ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            <span>Save Record</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── VIEW RECORD DETAIL MODAL ─── */}
            {viewingRecord && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up-fade max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                    {viewingRecord.category}
                                </span>
                                <h3 className="text-xl font-bold text-slate-900 mt-1">{viewingRecord.title}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Recorded on: {new Date(viewingRecord.recordDate || viewingRecord.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingRecord(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            {viewingRecord.notes && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Notes</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{viewingRecord.notes}</p>
                                </div>
                            )}

                            {viewingRecord.fileData ? (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Artifact</p>
                                    {viewingRecord.fileType?.startsWith('image/') ? (
                                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 text-center p-2">
                                            <img
                                                src={viewingRecord.fileData}
                                                alt={viewingRecord.title}
                                                className="max-h-[420px] w-auto mx-auto rounded-xl object-contain shadow-sm"
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                                            <FileText className="w-12 h-12 text-indigo-600 mx-auto" />
                                            <p className="text-sm font-bold text-slate-800">{viewingRecord.fileName || 'Attached Document'}</p>
                                            <a
                                                href={viewingRecord.fileData}
                                                download={viewingRecord.fileName || 'medical-document'}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition"
                                            >
                                                <Download className="w-4 h-4" /> Download / Open File
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center text-slate-400 text-xs">
                                    No physical file attachment stored with this entry.
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <button
                                onClick={(e) => handleDeleteRecord(viewingRecord._id, e)}
                                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Document
                            </button>
                            <button
                                onClick={() => setViewingRecord(null)}
                                className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── CONSENT APPROVAL MODAL (VAULT) ─── */}
            {showConsentModal && activeRequest && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up-fade">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                    <Shield className="w-7 h-7" />
                                </div>
                                <button
                                    onClick={() => setShowConsentModal(false)}
                                    className="p-2 text-slate-300 hover:text-rose-500 rounded-xl hover:bg-slate-50 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Authorize Physician Sync</h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    Dr. {activeRequest?.doctorId?.name} is requesting access to your clinical record. Select which data elements to disclose:
                                </p>
                            </div>

                            <div className="space-y-2.5">
                                {availableFields.map((field) => (
                                    <button
                                        key={field.id}
                                        type="button"
                                        onClick={() => toggleField(field.id)}
                                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                                            selectedFields[field.id]
                                                ? 'bg-indigo-50/60 border-indigo-200'
                                                : 'bg-white border-slate-100 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                                selectedFields[field.id] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                <field.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{field.label}</p>
                                                <p className="text-[10px] text-slate-400">{field.desc}</p>
                                            </div>
                                        </div>
                                        <div className={`w-9 h-5 rounded-full relative transition-colors ${
                                            selectedFields[field.id] ? 'bg-indigo-600' : 'bg-slate-200'
                                        }`}>
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                                                selectedFields[field.id] ? 'right-0.5' : 'left-0.5'
                                            }`} />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="pt-2 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleDeny(activeRequest._id)}
                                    disabled={actionLoading}
                                    className="py-3.5 border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Deny Access'}
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="py-3.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Authorize Sync'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <footer className="pt-10 border-t border-slate-100 text-center pb-8">
                <p className="text-[10px] font-black text-indigo-500/40 uppercase tracking-[0.2em] italic">
                    Design and Developed by Mohsin, Wasif, Furqan, Arya, Tamanna
                </p>
            </footer>
        </div>
    );
};

// ─── CONSULTATION CASE CARD COMPONENT ──────────────────────────────────────────
const CaseCard = ({ c, isExpanded, onToggle }) => (
    <div className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
        isExpanded ? 'border-indigo-200 shadow-xl' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
    }`}>
        <div className="p-6 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm shrink-0">
                        <Activity className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-slate-900 tracking-tight font-outfit">
                            Dr. {c.doctorId?.name || 'Practitioner'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                                <Calendar className="w-3.5 h-3.5" /> {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                c.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            }`}>
                                {c.status}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onToggle}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-600 transition shadow-sm self-end md:self-auto"
                >
                    <span>{isExpanded ? 'Close Vault' : 'View Clinical Data'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Expanded Content */}
            {c.structuredData && (
                <div className={`mt-8 space-y-8 pt-6 border-t border-slate-100 transition-all ${isExpanded ? 'block' : 'hidden'}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Diagnosis & Symptoms */}
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Diagnosis</p>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <p className="text-xl font-black text-slate-900 tracking-tight">
                                    {c.structuredData.diagnosis === 'RESTRICTED' ? '🔒 Restricted by Patient' : c.structuredData.diagnosis}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {c.structuredData.symptoms?.map((s, i) => (
                                    <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 shadow-sm">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Prescription Medicines Table */}
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Prescribed Medications</p>
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-3">Medicine</th>
                                            <th className="px-5 py-3">Dosage & Frequency</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {c.structuredData.medicines?.length > 0 ? (
                                            c.structuredData.medicines.map((m, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    <td className="px-5 py-3.5 text-slate-900 font-bold">{m.name}</td>
                                                    <td className="px-5 py-3.5 text-indigo-600">{m.dosage} • {m.frequency}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="2" className="px-5 py-3.5 text-slate-400 italic text-center">
                                                    Restricted or none prescribed
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Advice & Prescription Image */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-slate-100">
                        <div className="lg:col-span-2 space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor's Lifestyle Advisory</p>
                            <div className="p-6 bg-indigo-50/40 rounded-2xl text-slate-700 italic text-sm leading-relaxed border border-indigo-100/60">
                                {c.structuredData.advice === 'RESTRICTED' ? '🔒 Access restricted by patient settings.' : (c.structuredData.advice || 'No advice recorded.')}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Prescription Artifact</p>
                            {c.prescriptionImage ? (
                                <div className="rounded-2xl border-4 border-white shadow-md overflow-hidden group">
                                    <img src={c.prescriptionImage} alt="RX" className="w-full h-auto object-cover group-hover:scale-105 transition duration-500" />
                                </div>
                            ) : (
                                <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-300">
                                    <ImageIcon className="w-8 h-8" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">No Image Attached</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resolution Notes */}
                    {c.resolutionNotes && c.resolutionNotes !== 'RESTRICTED' && c.resolutionNotes.trim() && (
                        <div className="bg-slate-900 p-6 rounded-2xl text-white flex items-center gap-4">
                            <Activity className="w-6 h-6 text-indigo-400 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Outcome Resolution</p>
                                <p className="text-sm font-semibold text-slate-200 mt-0.5">{c.resolutionNotes}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
);

export default PatientDashboard;
