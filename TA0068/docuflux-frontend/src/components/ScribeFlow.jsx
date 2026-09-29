import React, { useState, useEffect, useRef } from 'react';
import {
    Mic, Square, Sparkles, CheckCircle, Upload, X, FileText,
    Image as ImageIcon, Loader2, ShieldCheck, Activity, ArrowRight,
    Zap, Clock, User, RefreshCw, CheckCircle2, AlertCircle,
    FolderArchive, Download, Eye, Calendar
} from 'lucide-react';
import { processTranscript, saveCase, requestConsent, checkConsentStatus, getPatientMedicalRecords, getMedicalRecordById, getPatientProfileById } from '../services/data';

const ScribeFlow = ({ onComplete, initialPatientId = '' }) => {
    const [patientId, setPatientId] = useState(initialPatientId || '');
    const [patientName, setPatientName] = useState('');
    const [consentId, setConsentId] = useState('');
    const [consentStatus, setConsentStatus] = useState('Pending');

    const [patientProfile, setPatientProfile] = useState(null);
    const [patientRecords, setPatientRecords] = useState([]);

    useEffect(() => {
        if (initialPatientId) {
            setPatientId(initialPatientId);
        }
    }, [initialPatientId]);

    const [showRecordsModal, setShowRecordsModal] = useState(false);
    const [viewingRecord, setViewingRecord] = useState(null);
    const [loadingRecordDetail, setLoadingRecordDetail] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);
    const [structuredData, setStructuredData] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [prescriptionImage, setPrescriptionImage] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Stages: 'identify' → 'consent-pending' → 'record' → 'preview'
    const [stage, setStage] = useState('identify');

    const recognitionRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setTranscript((prev) => prev + event.results[i][0].transcript + ' ');
                    }
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
                if (event.error !== 'no-speech') {
                    setError('Microphone error: ' + event.error + '. You can still type manually.');
                }
            };

            recognitionRef.current.onend = () => {
                if (isRecording) setIsRecording(false);
            };
        }
    }, []);

    // ─── Stage: Identify Patient ─────────────────────────────────────────────
    const handleIdentifyPatient = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const cleanId = patientId.trim().replace(/^#/, '');
            const consent = await requestConsent(cleanId);
            // consent.patientId may be a populated object { _id, name, email }
            // or a raw ObjectId string if populate failed
            const pId = consent.patientId?._id || consent.patientId;
            const pName = consent.patientId?.name;   // only available if populated

            setConsentId(consent._id);
            setPatientId(String(pId));
            setPatientName(pName || `Patient (${String(pId).slice(-6)})`);
            setConsentStatus(consent.status);

            if (consent.status === 'Approved') {
                // Pre-existing approved consent — go straight to record
                setStage('record');
            } else {
                setStage('consent-pending');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Patient not found. Check the ID and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if ((stage === 'record' || stage === 'preview') && patientId) {
            getPatientMedicalRecords(patientId)
                .then(recs => setPatientRecords(recs || []))
                .catch(err => console.error('Error fetching patient past records:', err));
            getPatientProfileById(patientId)
                .then(prof => setPatientProfile(prof))
                .catch(err => console.error('Error fetching patient profile:', err));
        }
    }, [stage, patientId]);

    const handleInspectRecord = async (recordId) => {
        try {
            setLoadingRecordDetail(true);
            const full = await getMedicalRecordById(recordId);
            setViewingRecord(full);
        } catch (err) {
            console.error('Failed to get record:', err);
        } finally {
            setLoadingRecordDetail(false);
        }
    };

    // ─── Stage: Check Consent Status ─────────────────────────────────────────
    const handleCheckConsent = async () => {
        setLoading(true);
        setError('');

        try {
            const consent = await checkConsentStatus(consentId);
            setConsentStatus(consent.status);
            if (consent.status === 'Approved') {
                setSuccessMsg('Consent approved! You can now begin scribing.');
                setTimeout(() => { setSuccessMsg(''); setStage('record'); }, 1500);
            } else if (consent.status === 'Expired') {
                setError('Patient denied access. You can request again or choose a different patient.');
            } else {
                setError('Consent is still pending. Ask the patient to approve from their Clinical Vault.');
            }
        } catch (err) {
            setError('Could not check consent status. Try again.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Recording Controls ──────────────────────────────────────────────────
    const toggleRecording = () => {
        if (!recognitionRef.current) {
            setError('Speech recognition not supported in this browser. Please type your transcript manually.');
            return;
        }
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            setError('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be under 5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setPrescriptionImage(reader.result);
        reader.readAsDataURL(file);
    };

    // ─── Process Transcript with AI ──────────────────────────────────────────
    const handleProcessTranscript = async () => {
        if (!transcript.trim()) {
            setError('Please record or type a consultation transcript first.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await processTranscript(transcript);
            setStructuredData(data);
            setStage('preview');
        } catch (err) {
            setError(err.response?.data?.message || 'AI processing failed. Check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Save Case ───────────────────────────────────────────────────────────
    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        try {
            await saveCase({ patientId, transcript, structuredData, resolutionNotes, prescriptionImage });
            setSuccessMsg('Case archived successfully!');
            setTimeout(() => onComplete(), 1200);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save case.';
            setError(msg.includes('consent') ? '⚠️ ' + msg + ' Ask the patient to approve consent first.' : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 selection:bg-indigo-100 selection:text-indigo-900">

            {/* ─── STAGE: IDENTIFY ─────────────────────────────────────────── */}
            {stage === 'identify' && (
                <div className="bg-white rounded-[3.5rem] p-16 lg:p-24 shadow-2xl shadow-indigo-100 border border-slate-100 flex flex-col items-center text-center animate-fade-in relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="w-28 h-28 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mb-10 shadow-2xl shadow-indigo-200 border-4 border-white relative z-10 group-hover:scale-105 transition-transform duration-500">
                        <ShieldCheck className="w-14 h-14" />
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 italic uppercase font-outfit">Identity Port</h2>
                    <p className="text-slate-500 max-w-md mb-14 font-medium leading-relaxed">
                        Enter the patient's unique 6-character Health ID. The patient can find their <strong>#ID</strong> in their Clinical Vault header.
                    </p>

                    <form onSubmit={handleIdentifyPatient} className="w-full max-w-sm space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4 block">Secure Patient Identifier</label>
                            <input
                                type="text"
                                placeholder="#ab1c2d or full ID..."
                                className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-indigo-50 focus:border-indigo-600 text-center font-mono text-xl font-black tracking-widest text-slate-900 transition-all placeholder:text-slate-200 placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-slate-300 hover:bg-indigo-600 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Request Clinical Access <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>
                    {error && <p className="mt-8 text-rose-500 font-bold text-xs bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 max-w-sm text-center">{error}</p>}
                </div>
            )}

            {/* ─── STAGE: CONSENT PENDING ───────────────────────────────────── */}
            {stage === 'consent-pending' && (
                <div className="bg-white rounded-[3.5rem] p-16 shadow-2xl shadow-indigo-100 border border-slate-100 flex flex-col items-center text-center animate-fade-in space-y-10">
                    <div className="w-24 h-24 bg-amber-50 border-4 border-amber-100 rounded-[2rem] flex items-center justify-center">
                        <Clock className="w-12 h-12 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase mb-3">Consent Requested</h2>
                        <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                            A consent request has been sent to <strong>{patientName}</strong>. Ask them to open their Clinical Vault and tap <strong>"Authorize Sync"</strong>.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-3xl p-8 w-full max-w-sm space-y-3 border border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Patient</span>
                            <span className="font-bold text-slate-900">{patientName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Consent Status</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${consentStatus === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {consentStatus}
                            </span>
                        </div>
                    </div>

                    {error && <p className="text-rose-500 font-bold text-xs bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 w-full max-w-sm">{error}</p>}
                    {successMsg && <p className="text-emerald-600 font-bold text-xs bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 w-full max-w-sm">{successMsg}</p>}

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                        <button
                            onClick={handleCheckConsent}
                            disabled={loading}
                            className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Check Approval</>}
                        </button>
                        <button
                            onClick={() => setStage('identify')}
                            className="flex-1 border border-slate-200 text-slate-500 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition"
                        >
                            Change Patient
                        </button>
                    </div>
                </div>
            )}

            {/* ─── STAGE: RECORD ────────────────────────────────────────────── */}
            {stage === 'record' && (
                <div className="space-y-12 animate-fade-in">
                    {/* Patient context banner */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-100">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Patient Session</p>
                                <div className="flex items-center gap-3">
                                    <p className="font-extrabold text-indigo-950 text-lg">{patientName}</p>
                                    {patientProfile?.bloodGroup && patientProfile.bloodGroup !== 'RESTRICTED' && (
                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-xs font-bold">
                                            🩸 {patientProfile.bloodGroup}
                                        </span>
                                    )}
                                </div>
                                {patientProfile?.allergies && patientProfile.allergies !== 'RESTRICTED' && (
                                    <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                                        <AlertCircle className="w-3.5 h-3.5" /> Allergies: {patientProfile.allergies}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowRecordsModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-50 transition shadow-sm"
                            >
                                <FolderArchive className="w-4 h-4 text-indigo-600" />
                                <span>Patient Past Records ({patientRecords.length})</span>
                            </button>
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Consent Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Mic Controller */}
                        <div className="lg:col-span-1 bg-slate-900 rounded-[3rem] p-12 shadow-2xl shadow-indigo-100/50 flex flex-col items-center justify-center text-center text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl opacity-50" />
                            <div className="relative mb-12">
                                {isRecording && <div className="absolute -inset-10 bg-indigo-500/20 rounded-full animate-ping" />}
                                <button
                                    onClick={toggleRecording}
                                    className={`w-36 h-36 rounded-full flex items-center justify-center transition-all shadow-[0_0_60px_-15px_rgba(0,0,0,0.3)] border-8 border-white/5 ${isRecording ? 'bg-rose-500 shadow-rose-900/40 animate-pulse' : 'bg-indigo-600 shadow-indigo-900/40 hover:scale-105 hover:bg-indigo-500'}`}
                                >
                                    {isRecording ? <Square className="w-12 h-12 text-white fill-white" /> : <Mic className="w-12 h-12 text-white" />}
                                </button>
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2 font-outfit">
                                {isRecording ? 'LIVE_STREAM' : 'NODE_READY'}
                            </h3>
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em] opacity-70 mb-12">
                                {isRecording ? 'CAPTURING CLINICAL INTENT' : 'AWAITING VOICE INPUT'}
                            </p>

                            <div className="w-full pt-10 border-t border-white/10 grid grid-cols-2 gap-4 relative z-10">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex flex-col items-center gap-3 transition-colors"
                                >
                                    <Upload className="w-6 h-6 text-indigo-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">UPLOAD_RX</span>
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

                                <button
                                    onClick={() => {
                                        setTranscript(prev => prev + '\n\n[Manual Entry Mode — type below] ');
                                    }}
                                    className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex flex-col items-center gap-3 transition-colors group/btn"
                                    title="Switch to manual text entry"
                                >
                                    <Zap className="w-6 h-6 text-indigo-400 group-hover/btn:text-yellow-400 transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">MANUAL</span>
                                </button>
                            </div>
                        </div>

                        {/* Transcript Area */}
                        <div className="lg:col-span-2 space-y-8">
                            {prescriptionImage && (
                                <div className="bg-indigo-600 rounded-3xl p-6 text-white flex items-center justify-between shadow-2xl shadow-indigo-200 animate-slide-up-fade relative overflow-hidden">
                                    <div className="flex items-center gap-6 relative z-10">
                                        <img src={prescriptionImage} alt="Prescription" className="w-20 h-20 object-cover rounded-2xl border-2 border-white/20 shadow-xl" />
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100">Artifact Digitized</p>
                                            <p className="font-bold text-lg tracking-tight">Prescription Node Attached</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setPrescriptionImage('')} className="p-3 bg-white/10 hover:bg-rose-500 rounded-xl transition relative z-10">
                                        <X className="w-6 h-6 text-white" />
                                    </button>
                                </div>
                            )}

                            <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-slate-100 border border-slate-100 h-full flex flex-col min-h-[500px]">
                                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px]">Real-time Clinical Stream</h3>
                                    {isRecording && (
                                        <div className="ml-auto flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                            Recording
                                        </div>
                                    )}
                                </div>

                                <textarea
                                    className="flex-1 w-full bg-transparent text-slate-900 text-lg font-bold leading-relaxed outline-none resize-none placeholder:text-slate-100 placeholder:italic"
                                    placeholder="Consultation data cascades here as you speak... or type directly."
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                />

                                {error && (
                                    <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <p className="text-xs font-bold">{error}</p>
                                    </div>
                                )}

                                <div className="mt-10 pt-10 border-t border-slate-50 flex justify-center">
                                    <button
                                        onClick={handleProcessTranscript}
                                        disabled={loading || !transcript.trim()}
                                        className="bg-indigo-600 text-white px-16 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center gap-4 disabled:opacity-50 disabled:scale-100 group"
                                    >
                                        {loading
                                            ? <><Loader2 className="w-6 h-6 animate-spin" /> Processing with AI...</>
                                            : <><Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" /> Structure with Flow Engine</>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── STAGE: PREVIEW ───────────────────────────────────────────── */}
            {stage === 'preview' && structuredData && (
                <div className="space-y-12 animate-fade-in">
                    <header className="bg-indigo-600 rounded-[3.5rem] p-16 lg:p-20 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.3)] relative overflow-hidden group">
                        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-105 transition-transform duration-700">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <div>
                                <h2 className="text-5xl font-black tracking-tighter italic uppercase font-outfit">Sync Preview</h2>
                                <p className="text-indigo-100 text-lg font-medium opacity-80 mt-1">
                                    Structured by Flow AI. Review and edit before archiving.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            {successMsg && (
                                <div className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold text-sm">
                                    <CheckCircle2 className="w-5 h-5" /> {successMsg}
                                </div>
                            )}
                            {error && (
                                <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-400/30 text-white px-6 py-3 rounded-2xl font-bold text-xs max-w-xs text-center">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                </div>
                            )}
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="bg-white text-indigo-600 px-16 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-50 transition-all transform hover:-translate-y-1 flex items-center gap-4 group disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Archive Node <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></>}
                            </button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-12">
                            <PreviewSection title="Clinical Domain" icon={<Activity className="w-5 h-5 text-indigo-500" />}>
                                <div className="space-y-8">
                                    <PreviewField label="Identified Diagnosis">
                                        <input
                                            className="w-full bg-slate-50 border border-slate-100 px-8 py-5 rounded-3xl font-black text-xl italic uppercase text-slate-900 focus:border-indigo-600 outline-none transition-all shadow-inner"
                                            value={structuredData.diagnosis || ''}
                                            onChange={(e) => setStructuredData({ ...structuredData, diagnosis: e.target.value })}
                                        />
                                    </PreviewField>
                                    <PreviewField label="Observed Symptoms (Comma Separated)">
                                        <input
                                            className="w-full bg-slate-50 border border-slate-100 px-8 py-5 rounded-3xl font-bold text-slate-600 focus:border-indigo-600 outline-none transition-all"
                                            value={Array.isArray(structuredData.symptoms) ? structuredData.symptoms.join(', ') : (structuredData.symptoms || '')}
                                            onChange={(e) => setStructuredData({ ...structuredData, symptoms: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                        />
                                    </PreviewField>
                                </div>
                            </PreviewSection>

                            <PreviewSection title="Resolution Protocol" icon={<FileText className="w-5 h-5 text-teal-500" />}>
                                <textarea
                                    className="w-full bg-slate-900/5 border border-indigo-100 px-8 py-8 rounded-[2.5rem] font-bold text-slate-800 italic outline-none min-h-[160px] shadow-sm leading-relaxed"
                                    placeholder="Add clinical resolution notes..."
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                />
                            </PreviewSection>
                        </div>

                        <div className="space-y-12">
                            <PreviewSection title="Pharmaceutical Matrix" icon={<Zap className="w-5 h-5 text-amber-500" />}>
                                <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-100/50">
                                    <table className="w-full text-left font-bold text-sm">
                                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="px-8 py-6">Molecule</th>
                                                <th className="px-8 py-6">Protocol</th>
                                                <th className="px-8 py-6 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(structuredData.medicines || []).map((med, idx) => (
                                                <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                                                    <td className="px-8 py-6 text-slate-900 font-black italic uppercase tracking-tight">{med.name}</td>
                                                    <td className="px-8 py-6 text-indigo-600 text-xs font-black uppercase tracking-tighter">{med.dosage} • {med.frequency}</td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button
                                                            onClick={() => {
                                                                const newMeds = structuredData.medicines.filter((_, i) => i !== idx);
                                                                setStructuredData({ ...structuredData, medicines: newMeds });
                                                            }}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {(structuredData.medicines || []).length === 0 && (
                                        <p className="px-8 py-6 text-slate-300 text-sm font-bold italic text-center">No medicines prescribed.</p>
                                    )}
                                </div>
                            </PreviewSection>

                            <PreviewSection title="Behavioral Advice" icon={<FileText className="w-5 h-5 text-blue-500" />}>
                                <textarea
                                    className="w-full bg-white border border-slate-200 px-8 py-8 rounded-[2.5rem] font-medium text-slate-600 outline-none min-h-[140px] shadow-sm leading-relaxed"
                                    value={structuredData.advice || ''}
                                    onChange={(e) => setStructuredData({ ...structuredData, advice: e.target.value })}
                                />
                            </PreviewSection>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: PATIENT PAST RECORDS INSPECTION ─── */}
            {showRecordsModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up-fade max-h-[85vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <FolderArchive className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Patient Clinical Archive: {patientName}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Uploaded past history, lab results, X-rays & prescriptions ({patientRecords.length} records)
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowRecordsModal(false); setViewingRecord(null); }}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            {patientRecords.length === 0 ? (
                                <div className="text-center py-16 space-y-2">
                                    <FolderArchive className="w-12 h-12 text-slate-200 mx-auto" />
                                    <p className="text-slate-600 font-bold text-sm">No Past Records Uploaded</p>
                                    <p className="text-slate-400 text-xs">The patient has not uploaded previous medical documents yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {patientRecords.map((rec) => (
                                        <div
                                            key={rec._id}
                                            onClick={() => handleInspectRecord(rec._id)}
                                            className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer flex flex-col justify-between space-y-2 group"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                                        {rec.fileType?.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">{rec.title}</h4>
                                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{rec.category}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {rec.notes && <p className="text-xs text-slate-500 line-clamp-2">{rec.notes}</p>}

                                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                                                <span>{new Date(rec.recordDate || rec.createdAt).toLocaleDateString()}</span>
                                                <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:underline">
                                                    <Eye className="w-3.5 h-3.5" /> Inspect
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Record Detail Preview inside modal */}
                            {loadingRecordDetail && (
                                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-slate-500">Loading document artifact...</p>
                                </div>
                            )}

                            {viewingRecord && !loadingRecordDetail && (
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-slate-900">{viewingRecord.title}</h4>
                                        <button
                                            onClick={() => setViewingRecord(null)}
                                            className="text-xs text-slate-400 hover:text-slate-600"
                                        >
                                            Hide Preview
                                        </button>
                                    </div>
                                    {viewingRecord.fileData ? (
                                        viewingRecord.fileType?.startsWith('image/') ? (
                                            <img
                                                src={viewingRecord.fileData}
                                                alt={viewingRecord.title}
                                                className="max-h-80 w-auto mx-auto rounded-xl shadow-sm"
                                            />
                                        ) : (
                                            <div className="text-center py-6 space-y-2">
                                                <FileText className="w-10 h-10 text-indigo-600 mx-auto" />
                                                <p className="text-xs font-bold text-slate-700">{viewingRecord.fileName}</p>
                                                <a
                                                    href={viewingRecord.fileData}
                                                    download={viewingRecord.fileName || 'record'}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                                                >
                                                    <Download className="w-3.5 h-3.5" /> Download File
                                                </a>
                                            </div>
                                        )
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No file attachment.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => { setShowRecordsModal(false); setViewingRecord(null); }}
                                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                            >
                                Close Archive
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PreviewSection = ({ title, icon, children }) => (
    <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-slate-200/40 border border-slate-100 space-y-8 animate-fade-in">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">{icon}</div>
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">{title}</h3>
        </div>
        {children}
    </div>
);

const PreviewField = ({ label, children }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] pl-3 block">{label}</label>
        {children}
    </div>
);

export default ScribeFlow;
