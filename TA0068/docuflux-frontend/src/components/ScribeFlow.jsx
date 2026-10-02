import React, { useState, useEffect, useRef } from 'react';
import {
    Mic, Square, Sparkles, CheckCircle, Upload, X, FileText,
    Image as ImageIcon, Loader2, ShieldCheck, Activity, ArrowRight,
    Zap, Clock, User, RefreshCw, CheckCircle2, AlertCircle,
    FolderArchive, Download, Eye, Calendar, Plus, Trash2,
    Stethoscope, Pill, AlertTriangle, Shield, Check, ArrowLeft,
    Clipboard, HeartPulse, ChevronDown, CheckCheck, Copy,
    FileSpreadsheet, Thermometer, ShieldAlert, Edit3, Printer
} from 'lucide-react';
import {
    processTranscript, saveCase, requestConsent, checkConsentStatus,
    getPatientMedicalRecords, getMedicalRecordById, getPatientProfileById
} from '../services/data';

// 6 Rich Clinical Dialogue Presets for 1-Click Testing
const CLINICAL_SAMPLES = [
    {
        category: 'Respiratory',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        title: 'Acute Bacterial Bronchitis & High Fever',
        shortDesc: 'Productive cough, green phlegm, fever 38.6°C, lower lobe rhonchi',
        text: `Doctor: Good morning, what brings you into the clinic today?
Patient: Doctor, I've had a terrible productive cough for four days now. The phlegm is yellowish-green and thick. I also started having high fever since yesterday evening with chills and body aches.
Doctor: Have you measured your temperature at home?
Patient: Yes, it was 38.6 Celsius last night. It hurts in the middle of my chest when I have coughing fits.
Doctor: Any shortness of breath or wheezing?
Patient: A little out of breath when climbing stairs, but mostly it's the throat pain and constant coughing keeping me awake.
Doctor: On examination, tonsils are swollen with mild exudate, bilateral rhonchi on lower lung fields, no crackles. I am going to prescribe an antibiotic course of Augmentin 625mg twice a day for 7 days. For the fever and chest ache, take Paracetamol 650mg every 6 to 8 hours as needed. Also a cough expectorant with Ambroxol 10ml three times daily, and Montair-LC at night for airway soothing.
Patient: Should I get any blood tests or X-rays?
Doctor: Let's do a complete blood count today. If the fever persists past 48 hours or breathing becomes labored, we will order a chest X-ray. Drink at least 3 liters of warm fluids daily, warm saline gargles, and rest completely for 48 hours. Follow up in 5 days.`
    },
    {
        category: 'Gastroenterology',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        title: 'Peptic Dyspepsia & Severe Acid Reflux',
        shortDesc: 'Retrosternal burning, nausea, postprandial acid regurgitation',
        text: `Doctor: Hello, what symptoms are you experiencing?
Patient: Doctor, I have severe burning in the upper stomach right below the ribs for the past week. It gets significantly worse about 30 minutes after eating, especially dinner. I also have sour fluid coming up my throat and nausea every morning.
Doctor: Any vomiting or black tarry stools?
Patient: No vomiting yet, but constant nausea and feeling bloated after eating even small amounts.
Doctor: This presentation is consistent with acute peptic dyspepsia and gastroesophageal reflux. I'm placing you on Pantoprazole 40mg once daily 30 minutes before breakfast for 14 days. For the acute nausea, take Ondansetron 4mg before meals as needed. Also take a course of probiotics for 5 days.
Patient: What food should I avoid?
Doctor: Strictly avoid spicy, oily, citrus, caffeinated, and fried foods. Eat small frequent bland meals and do not lie down for at least 2 hours after eating. If you ever vomit blood or notice black stools, go to the emergency room immediately. Re-evaluate with me in 10 days.`
    },
    {
        category: 'Dentistry',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        title: 'Acute Periapical Odontalgia & Tooth Infection',
        shortDesc: 'Severe throbbing molar pain, facial swelling, mastication tenderness',
        text: `Doctor: What is the main problem today?
Patient: I have severe throbbing pain on the lower right molar tooth for three days. It throbs constantly and gets unbearable when drinking cold water or chewing. My cheek feels slightly swollen today.
Doctor: Upon inspection, deep dental caries on lower right second molar (#47) with localized periapical tenderness and gingival erythema. There is early odontogenic infection.
Doctor: I am prescribing Augmentin 625mg twice daily after meals for 5 days to control the infection, Zerodol-P (Aceclofenac + Paracetamol) twice daily after meals for acute pain, and Pantoprazole 40mg before breakfast for stomach protection. Also rinse with Chlorhexidine 0.2% mouthwash twice daily.
Patient: Do I need a root canal?
Doctor: Yes, we need to schedule an endodontic consultation within 48 to 72 hours once the acute bacterial flare subsides. If swelling spreads down your neck or you have trouble opening your mouth, seek emergency care.`
    },
    {
        category: 'Cardiology',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        title: 'Exertional Precordial Chest Tightness & Stage 2 HTN',
        shortDesc: 'Retrosternal pressure, BP 155/95 mmHg, palpitations on exertion',
        text: `Doctor: Good afternoon, tell me what you are feeling.
Patient: Doctor, over the past three days I have had a heavy tightness right in the center of my chest when walking fast or climbing stairs. It eases up after resting 5 minutes. I also felt my heart racing and felt dizzy.
Doctor: Let's check your vitals. Your blood pressure is 155 over 95 millimeters of mercury, pulse is 98 beats per minute. S1 and S2 heart sounds are normal, no murmurs.
Doctor: We need to initiate an immediate cardiology workup. I am prescribing Aspirin 75mg once daily after lunch, Telmisartan 40mg with Amlodipine 5mg once daily in the morning, and Atorvastatin 20mg at bedtime.
Patient: Do I need an ECG?
Doctor: Yes, we will perform a 12-lead ECG right now, and order blood tests for Cardiac Troponin-I and a lipid profile. Strictly avoid heavy physical exertion, eliminate salt and tobacco. If you feel crushing pain radiating to your jaw or left arm, go straight to the emergency department.`
    },
    {
        category: 'Neurology',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        title: 'Acute Tension Cephalalgia & Severe Migraine',
        shortDesc: 'Constrictive band headache, photophobia, postural dizziness',
        text: `Doctor: What symptoms are troubling you today?
Patient: Doctor, I have had a severe throbbing headache across both sides of my forehead and the back of my neck for the last 3 days. Bright lights hurt my eyes, and I felt nauseous this morning.
Doctor: Any weakness in your arms or legs, or numbness?
Patient: No weakness, but my neck muscles feel like tight ropes and I get lightheaded when standing up quickly.
Doctor: Neurological examination is intact with no focal deficits. This is an acute tension headache with cervicogenic muscular spasm. I am prescribing Naproxen 500mg twice daily after meals as needed, Paracetamol 650mg, Betahistine 16mg twice daily for dizziness, and Pantoprazole 40mg before breakfast. Rest in a dark, quiet room and drink at least 2.5 liters of water daily.`
    },
    {
        category: 'General Medicine',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        title: 'Acute Febrile Syndrome & Somatic Asthenia',
        shortDesc: 'High fever 38.8°C, body aches, severe fatigue, loss of appetite',
        text: `Doctor: What seems to be the trouble?
Patient: Doctor, I have been feeling completely sick for 3 days. I have high fever reaching 38.8°C with severe body aches, shivering, headache behind the eyes, and zero energy. I can barely eat anything.
Doctor: On examination, temperature is 38.6°C, pulse 102 bpm, throat is mildly congested, no skin rash. Abdomen is soft without tenderness.
Doctor: I am ordering a full febrile panel: Complete Blood Count, Dengue NS1 antigen, and Malarial parasite smear. In the meantime, I am prescribing Paracetamol 650mg every 6 hours for fever, Augmentin 625mg twice daily after meals, Pantoprazole 40mg before breakfast, and WHO Oral Rehydration Solution packets. Drink plenty of electrolyte fluids and log your temperature every 4 hours. Follow up in 48 hours.`
    }
];

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

    // Audio & Dictation state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);
    const [structuredData, setStructuredData] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [prescriptionImage, setPrescriptionImage] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [copiedRx, setCopiedRx] = useState(false);

    // New medication inline modal state
    const [showAddMedModal, setShowAddMedModal] = useState(false);
    const [newMed, setNewMed] = useState({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
    });

    // Inline input state
    const [newSymptomInput, setNewSymptomInput] = useState('');
    const [newInvestigationInput, setNewInvestigationInput] = useState('');
    const [editingDiagnosis, setEditingDiagnosis] = useState(false);

    // Stages: 'identify' → 'consent-pending' → 'record' → 'preview'
    const [stage, setStage] = useState('identify');

    const recognitionRef = useRef(null);
    const fileInputRef = useRef(null);
    const timerRef = useRef(null);

    // Recording Timer
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setRecordingSeconds(0);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    const formatTimer = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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
                    setError('Microphone note: ' + event.error + '. You can also type or use clinical presets.');
                }
            };

            recognitionRef.current.onend = () => {
                if (isRecording) setIsRecording(false);
            };
        }
    }, [isRecording]);

    // ─── Stage 1: Identify Patient ─────────────────────────────────────────────
    const handleIdentifyPatient = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setError('');
        try {
            const cleanId = patientId.trim().replace(/^#/, '');
            const consent = await requestConsent(cleanId);
            const pId = consent.patientId?._id || consent.patientId;
            const pName = consent.patientId?.name;

            setConsentId(consent._id);
            setPatientId(String(pId));
            setPatientName(pName || `Patient (${String(pId).slice(-6)})`);
            setConsentStatus(consent.status);

            if (consent.status === 'Approved') {
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
                .catch(err => console.error('Error fetching patient records:', err));
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

    // ─── Stage: Verify Consent Status ─────────────────────────────────────────
    const handleCheckConsent = async () => {
        setLoading(true);
        setError('');
        try {
            const consent = await checkConsentStatus(consentId);
            setConsentStatus(consent.status);
            if (consent.status === 'Approved') {
                setSuccessMsg('Consent verified! Opening clinical scribing station.');
                setTimeout(() => { setSuccessMsg(''); setStage('record'); }, 1000);
            } else if (consent.status === 'Expired') {
                setError('Patient denied clinical access. Request again or verify patient identity.');
            } else {
                setError('Consent is still pending approval on the patient vault.');
            }
        } catch (err) {
            setError('Could not verify consent status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Recording Controls ──────────────────────────────────────────────────
    const toggleRecording = () => {
        if (!recognitionRef.current) {
            setError('Speech recognition not supported in this browser. Please type or use quick clinical presets.');
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

    // ─── Prescription Upload Handler ─────────────────────────────────────────
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (PNG, JPG, etc.)');
            return;
        }
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
            setPrescriptionImage(uploadEvent.target.result);
        };
        reader.readAsDataURL(file);
    };

    // ─── Stage: Process with AI Clinical Engine ──────────────────────────────
    const handleProcessTranscript = async () => {
        if (!transcript.trim()) {
            setError('Please record audio or select a clinical preset before generating prescription.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const data = await processTranscript(transcript);
            setStructuredData(data);
            setStage('preview');
        } catch (err) {
            console.error('Process error:', err);
            setError(err.response?.data?.message || 'Clinical processing failed. Check network or API configuration.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Stage: Finalize & Save Encounter ────────────────────────────────────
    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        try {
            await saveCase({
                patientId,
                transcript,
                structuredData,
                resolutionNotes,
                prescriptionImage,
            });
            setSuccessMsg('✓ Clinical Prescription finalized and saved to Electronic Health Record!');
            setTimeout(() => onComplete(), 1200);
        } catch (err) {
            console.error('Save error:', err);
            const msg = err.response?.data?.message || 'Failed to finalize encounter.';
            setError(msg.includes('consent') ? '⚠️ ' + msg + ' Ask patient to approve sync.' : msg);
        } finally {
            setLoading(false);
        }
    };

    // ─── Edit Handlers for Review Screen ─────────────────────────────────────
    const handleAddSymptom = (e) => {
        e?.preventDefault();
        if (!newSymptomInput.trim()) return;
        const currentSymptoms = Array.isArray(structuredData.symptoms) ? [...structuredData.symptoms] : [];
        setStructuredData({
            ...structuredData,
            symptoms: [...currentSymptoms, newSymptomInput.trim()]
        });
        setNewSymptomInput('');
    };

    const handleRemoveSymptom = (index) => {
        const updated = structuredData.symptoms.filter((_, i) => i !== index);
        setStructuredData({ ...structuredData, symptoms: updated });
    };

    const handleAddInvestigation = (e) => {
        e?.preventDefault();
        if (!newInvestigationInput.trim()) return;
        const current = Array.isArray(structuredData.investigations) ? [...structuredData.investigations] : [];
        setStructuredData({
            ...structuredData,
            investigations: [...current, newInvestigationInput.trim()]
        });
        setNewInvestigationInput('');
    };

    const handleRemoveInvestigation = (index) => {
        const updated = (structuredData.investigations || []).filter((_, i) => i !== index);
        setStructuredData({ ...structuredData, investigations: updated });
    };

    const handleAddMedication = (e) => {
        e?.preventDefault();
        if (!newMed.name.trim()) return;
        const currentMeds = Array.isArray(structuredData.medicines) ? [...structuredData.medicines] : [];
        setStructuredData({
            ...structuredData,
            medicines: [...currentMeds, { ...newMed }]
        });
        setNewMed({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
        setShowAddMedModal(false);
    };

    const handleRemoveMedication = (index) => {
        const updated = structuredData.medicines.filter((_, i) => i !== index);
        setStructuredData({ ...structuredData, medicines: updated });
    };

    const handleCopyPrescriptionSummary = () => {
        if (!structuredData) return;
        const lines = [
            `DOCTOR'S PRESCRIPTION & CLINICAL ENCOUNTER`,
            `Patient: ${patientName} | Encounter Date: ${new Date().toLocaleDateString()}`,
            `--------------------------------------------------`,
            `DIAGNOSIS: ${structuredData.diagnosis}`,
            ``,
            `CHIEF COMPLAINTS:`,
            ...(structuredData.symptoms || []).map(s => `• ${s}`),
            ``,
            `PRESCRIPTION (Rx):`,
            ...(structuredData.medicines || []).map((m, i) =>
                `${i + 1}. ${m.name} - ${m.dosage}\n   Schedule: ${m.frequency} | Duration: ${m.duration}\n   Notes: ${m.instructions}`
            ),
            ``,
            `DIAGNOSTIC INVESTIGATIONS:`,
            ...(structuredData.investigations || []).map(inv => `• ${inv}`),
            ``,
            `LIFESTYLE & SUPPORTIVE ADVICE:`,
            structuredData.advice,
            ``,
            `EMERGENCY WARNING SIGNS (RED FLAGS):`,
            structuredData.redFlags,
            ``,
            `FOLLOW-UP: ${structuredData.followUp}`
        ];
        navigator.clipboard.writeText(lines.join('\n'));
        setCopiedRx(true);
        setTimeout(() => setCopiedRx(false), 2000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-24 selection:bg-indigo-100 selection:text-indigo-900">

            {/* ─── Workflow Stepper Header ─────────────────────────────────── */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-4 lg:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-100">
                            <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 text-base">DocuFlux Clinical Scribing Workstation</h3>
                            <p className="text-xs text-slate-400">Academic-grade AI medical transcription & prescription generator</p>
                        </div>
                    </div>

                    {/* Stepper Dots */}
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                            stage === 'identify' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-100 text-slate-500'
                        }`}>
                            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
                            <span>Patient</span>
                        </div>
                        <span className="text-slate-300">→</span>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                            stage === 'record' ? 'bg-indigo-600 text-white font-black' : stage === 'preview' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                        }`}>
                            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
                            <span>Scribe Notes</span>
                        </div>
                        <span className="text-slate-300">→</span>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                            stage === 'preview' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-100 text-slate-400'
                        }`}>
                            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
                            <span>Prescription Review</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Errors & Alerts */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-700 text-sm font-bold shadow-sm animate-shake">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg transition"><X className="w-4 h-4" /></button>
                </div>
            )}
            {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold shadow-sm animate-fade-in">
                    <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* ─── STAGE 1: IDENTIFY PATIENT ───────────────────────────────── */}
            {stage === 'identify' && (
                <div className="bg-white rounded-[3rem] p-10 lg:p-16 shadow-xl shadow-slate-100 border border-slate-200 flex flex-col items-center text-center animate-fade-in relative overflow-hidden">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-100">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-3">
                        Select Consultation Patient
                    </h2>
                    <p className="text-slate-500 max-w-lg mb-8 text-sm font-medium leading-relaxed">
                        Enter the patient's unique <strong>Health ID</strong> (e.g. <em>#ab1c2d</em>) to request medical consent and decrypt past health records.
                    </p>

                    <form onSubmit={handleIdentifyPatient} className="w-full max-w-md space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider block text-left pl-2">
                                Patient Health ID
                            </label>
                            <input
                                type="text"
                                placeholder="#ab1c2d or full Mongo ID..."
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 text-center font-mono text-xl font-black tracking-widest text-slate-900 transition-all placeholder:text-slate-300 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Request Clinical Consent <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>
                </div>
            )}

            {/* ─── STAGE: CONSENT PENDING ───────────────────────────────────── */}
            {stage === 'consent-pending' && (
                <div className="bg-white rounded-[3rem] p-10 lg:p-14 shadow-xl shadow-slate-100 border border-slate-200 flex flex-col items-center text-center animate-fade-in max-w-2xl mx-auto space-y-6">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm animate-pulse">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Consent Verification Pending</h2>
                        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                            Consent request dispatched to <strong>{patientName}</strong> (#{patientId.slice(-6)}). Ask the patient to click <strong>"Approve Access"</strong> in their Clinical Vault.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
                        <button
                            onClick={handleCheckConsent}
                            disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Verify Approval</>}
                        </button>
                        <button
                            onClick={() => setStage('identify')}
                            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition"
                        >
                            Change Patient
                        </button>
                    </div>
                </div>
            )}

            {/* ─── STAGE 2: RECORD / DICTATE ───────────────────────────────── */}
            {stage === 'record' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Patient Context Bar */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-100 shrink-0">
                                {patientName?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-extrabold text-slate-900 text-lg">{patientName}</h3>
                                    {patientProfile?.bloodGroup && patientProfile.bloodGroup !== 'RESTRICTED' && (
                                        <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-xs font-black">
                                            🩸 {patientProfile.bloodGroup}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Patient ID: #{patientId.slice(-8)} · Gender: {patientProfile?.gender || 'N/A'} {patientProfile?.city ? `· ${patientProfile.city}` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {patientProfile?.allergies && patientProfile.allergies !== 'RESTRICTED' ? (
                                <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Allergies: {patientProfile.allergies}</span>
                                </span>
                            ) : (
                                <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-700">
                                    ✓ No Known Drug Allergies
                                </span>
                            )}

                            {patientRecords.length > 0 && (
                                <button
                                    onClick={() => setShowRecordsModal(true)}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-2"
                                >
                                    <FolderArchive className="w-3.5 h-3.5" />
                                    <span>Past Records ({patientRecords.length})</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scribing Workstation Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Left Column: Audio Controls & 1-Click Presets */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* Audio Dictation Card */}
                            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-6 relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5" /> Consultation Audio Scribe
                                    </span>
                                    {isRecording && (
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-black animate-pulse">
                                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                            REC {formatTimer(recordingSeconds)}
                                        </span>
                                    )}
                                </div>

                                <div className="text-center py-4 space-y-4">
                                    <button
                                        onClick={toggleRecording}
                                        className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-300 shadow-2xl relative ${
                                            isRecording
                                                ? 'bg-rose-600 text-white shadow-rose-900/50 scale-105 ring-8 ring-rose-500/20 animate-pulse'
                                                : 'bg-indigo-600 text-white shadow-indigo-900/50 hover:scale-105 hover:bg-indigo-500'
                                        }`}
                                    >
                                        {isRecording ? <Square className="w-9 h-9 fill-current" /> : <Mic className="w-9 h-9" />}
                                    </button>
                                    <div>
                                        <p className="font-extrabold text-sm text-slate-100">
                                            {isRecording ? 'Listening & Transcribing...' : 'Tap to Start Medical Dictation'}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {isRecording ? 'Speak naturally during consultation' : 'Dictate symptoms, history, diagnosis & orders'}
                                        </p>
                                    </div>
                                </div>

                                {/* Upload Paper Prescription */}
                                <div className="pt-4 border-t border-slate-800">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition"
                                    >
                                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>Attach Paper Prescription Photo</span>
                                    </button>
                                </div>
                            </div>

                            {/* Quick Clinical Encounter Presets (1-Click Test) */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Clinical Encounter Presets
                                    </p>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                        1-Click Test
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    Instantly load a realistic doctor-patient dialogue to test AI prescription generation:
                                </p>
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {CLINICAL_SAMPLES.map((sample, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setTranscript(sample.text)}
                                            className="w-full text-left p-3 rounded-2xl hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition group space-y-1"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${sample.badgeColor}`}>
                                                    {sample.category}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                                                {sample.title}
                                            </p>
                                            <p className="text-[10px] text-slate-400 line-clamp-1">
                                                {sample.shortDesc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Live Transcript Area & Action */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Attached Prescription Preview */}
                            {prescriptionImage && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <img src={prescriptionImage} alt="Prescription" className="w-16 h-16 object-cover rounded-xl border border-white shadow-sm" />
                                        <div>
                                            <p className="text-xs font-bold text-indigo-900">Physical Prescription Image Attached</p>
                                            <p className="text-[11px] text-indigo-600">Will be linked with the final electronic medical record.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setPrescriptionImage('')} className="p-2 text-indigo-400 hover:text-rose-600 transition">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* Live Transcript Box */}
                            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Activity className="w-4 h-4 text-indigo-600" />
                                        <h4 className="font-extrabold text-sm">Consultation Dialogue & Clinical Notes</h4>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 font-mono">
                                            {transcript.trim() ? `${transcript.trim().split(/\s+/).length} words` : '0 words'}
                                        </span>
                                        {transcript && (
                                            <button
                                                onClick={() => setTranscript('')}
                                                className="text-xs font-bold text-slate-400 hover:text-rose-600 transition"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <textarea
                                    className="flex-1 w-full bg-transparent text-slate-800 text-sm lg:text-base font-medium leading-relaxed outline-none resize-none placeholder:text-slate-300"
                                    placeholder="Doctor-patient dialogue will transcribe here automatically as you dictate, or you can paste clinical consultation notes directly (or select a preset on the left)..."
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                />

                                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <p className="text-xs text-slate-500 font-medium">DocuFlux Medical AI Engine · Ready</p>
                                    </div>

                                    <button
                                        onClick={handleProcessTranscript}
                                        disabled={loading || !transcript.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 transition flex items-center justify-center gap-2.5 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Synthesizing Medical Prescription...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                <span>Generate AI Prescription & Orders →</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── STAGE 3: PREVIEW & REVIEW PRESCRIPTION (CLEAN CLINICAL BOARD) ─ */}
            {stage === 'preview' && structuredData && (
                <div className="space-y-6 animate-fade-in">

                    {/* Official Prescription Header Card */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-black flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" /> Academic Clinical Synthesis
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">Encounter #{consentId?.slice(-6) || 'CLIN-01'}</span>
                                </div>
                                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
                                    Prescription & Clinical Encounter Review
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Patient: <strong>{patientName}</strong> · Review dosages, schedules, lab orders, and finalize.
                                </p>
                            </div>

                            {/* Header Quick Action Toolbar */}
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={handleCopyPrescriptionSummary}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                >
                                    {copiedRx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedRx ? 'Copied!' : 'Copy Rx Summary'}</span>
                                </button>
                                <button
                                    onClick={() => setStage('record')}
                                    className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Edit Notes</span>
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-100 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCheck className="w-4 h-4" /> Approve & Sign EHR</>}
                                </button>
                            </div>
                        </div>

                        {/* Patient Snapshot Bar inside Prescription */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient</span>
                                <span className="text-sm font-extrabold text-slate-800">{patientName}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Group</span>
                                <span className="text-sm font-extrabold text-slate-800">
                                    {patientProfile?.bloodGroup === 'RESTRICTED' ? '🔒 Restricted' : (patientProfile?.bloodGroup || 'Not recorded')}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Known Drug Allergies</span>
                                <span className="text-xs font-bold text-rose-600">
                                    {patientProfile?.allergies && patientProfile.allergies !== 'RESTRICTED' ? patientProfile.allergies : '✓ No known drug allergies'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Encounter Date</span>
                                <span className="text-xs font-extrabold text-slate-800">
                                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Clinical Diagnosis & Symptoms */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Primary Diagnosis Card */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                        <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Primary Clinical Diagnosis</h4>
                                        <p className="text-xs text-slate-500">ICD-10 clinical classification</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditingDiagnosis(!editingDiagnosis)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition rounded-lg hover:bg-slate-50"
                                    title="Edit diagnosis text"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            </div>

                            {editingDiagnosis ? (
                                <input
                                    className="w-full bg-indigo-50/60 border border-indigo-300 px-4 py-3 rounded-2xl font-bold text-base text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={structuredData.diagnosis || ''}
                                    onChange={(e) => setStructuredData({ ...structuredData, diagnosis: e.target.value })}
                                />
                            ) : (
                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                                    <p className="text-lg font-black text-indigo-950 leading-snug">
                                        {structuredData.diagnosis}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Symptoms & Chief Complaints */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                    <Clipboard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Chief Complaints & Observed Signs</h4>
                                    <p className="text-xs text-slate-500">Extracted clinical presentation</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 min-h-[44px]">
                                {(structuredData.symptoms || []).map((symptom, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200">
                                        <span>{symptom}</span>
                                        <button onClick={() => handleRemoveSymptom(idx)} className="text-slate-400 hover:text-rose-500 transition">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            {/* Add symptom inline */}
                            <form onSubmit={handleAddSymptom} className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <input
                                    type="text"
                                    placeholder="Add clinical symptom..."
                                    className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                                    value={newSymptomInput}
                                    onChange={(e) => setNewSymptomInput(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Section 2: Pharmacotherapy Prescription (Rx Table) */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-100">
                                    Rx
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Prescribed Pharmacotherapy Regimen</h3>
                                    <p className="text-xs text-slate-500">Therapeutic molecule, strength, administration schedule, and duration</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAddMedModal(true)}
                                className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto"
                            >
                                <Plus className="w-4 h-4" /> Add Medication
                            </button>
                        </div>

                        {/* Medications Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3.5">Medication & Molecule</th>
                                        <th className="px-5 py-3.5">Therapeutic Strength</th>
                                        <th className="px-5 py-3.5">Schedule / Timing</th>
                                        <th className="px-5 py-3.5">Course Duration</th>
                                        <th className="px-5 py-3.5">Clinical Instructions</th>
                                        <th className="px-5 py-3.5 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(structuredData.medicines || []).map((med, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/30 transition">
                                            <td className="px-5 py-4 font-bold text-slate-900">{med.name}</td>
                                            <td className="px-5 py-4">
                                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold font-mono">
                                                    {med.dosage}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-xs font-bold text-slate-700">{med.frequency}</td>
                                            <td className="px-5 py-4 text-xs font-semibold text-slate-600">{med.duration}</td>
                                            <td className="px-5 py-4 text-xs text-slate-500 italic max-w-xs">{med.instructions || 'Take as advised with water.'}</td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => handleRemoveMedication(idx)}
                                                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="Remove medication"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(structuredData.medicines || []).length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-xs italic">
                                    No medications recorded for this prescription. Click "+ Add Medication" above to add drug entries.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Diagnostic Investigations & Emergency Red Flags */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Recommended Diagnostic Lab Orders */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Diagnostic Investigations Ordered</h4>
                                    <p className="text-xs text-slate-500">Laboratory workups and imaging orders</p>
                                </div>
                            </div>

                            <div className="space-y-2 min-h-[48px]">
                                {(structuredData.investigations || []).map((test, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-800 border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                                            <span>{test}</span>
                                        </div>
                                        <button onClick={() => handleRemoveInvestigation(idx)} className="text-slate-300 hover:text-rose-500">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {(structuredData.investigations || []).length === 0 && (
                                    <p className="text-xs text-slate-400 italic py-2">No additional laboratory or diagnostic orders required at this stage.</p>
                                )}
                            </div>

                            {/* Add investigation inline */}
                            <form onSubmit={handleAddInvestigation} className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <input
                                    type="text"
                                    placeholder="Add lab order (e.g. Complete Blood Count, Chest X-Ray)..."
                                    className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium outline-none focus:border-teal-500"
                                    value={newInvestigationInput}
                                    onChange={(e) => setNewInvestigationInput(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add
                                </button>
                            </form>
                        </div>

                        {/* Critical Red Flags & Emergency Safety Net */}
                        <div className="bg-rose-50/60 border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-rose-200">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-700">Critical Red Flags & Emergency Safety Net</h4>
                                    <p className="text-xs text-rose-600">Triggers for urgent hospital Emergency Department presentation</p>
                                </div>
                            </div>

                            <textarea
                                className="w-full bg-white border border-rose-200 p-4 rounded-2xl text-xs font-semibold text-rose-950 leading-relaxed outline-none min-h-[110px]"
                                value={structuredData.redFlags || ''}
                                onChange={(e) => setStructuredData({ ...structuredData, redFlags: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Section 4: Dietary / Lifestyle Advice & Follow-Up */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Lifestyle Advisory */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <HeartPulse className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Dietary, Hydration & Supportive Guidance</h4>
                                    <p className="text-xs text-slate-500">Recovery precautions and clinical instructions</p>
                                </div>
                            </div>

                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-medium text-slate-700 leading-relaxed outline-none min-h-[120px]"
                                value={structuredData.advice || ''}
                                onChange={(e) => setStructuredData({ ...structuredData, advice: e.target.value })}
                            />
                        </div>

                        {/* Follow-up & Resolution Notes */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Review Timeline & Physician Notes</h4>
                                    <p className="text-xs text-slate-500">Follow-up schedule and encounter wrap-up</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Follow-Up Schedule</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none"
                                        value={structuredData.followUp || ''}
                                        onChange={(e) => setStructuredData({ ...structuredData, followUp: e.target.value })}
                                        placeholder="e.g. Review in clinic in 5 days..."
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Confidential Resolution Notes</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-medium text-slate-700 outline-none min-h-[65px]"
                                        placeholder="Private physician observations..."
                                        value={resolutionNotes}
                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                        <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
                            <strong>{structuredData.medicines?.length || 0}</strong> medications prescribed · <strong>{structuredData.investigations?.length || 0}</strong> lab orders · Ready for sign-off
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setStage('record')}
                                className="px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-xs font-bold transition flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Notes
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-100 transition flex items-center gap-2.5 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCheck className="w-4 h-4" /> Approve & Sign EHR</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: ADD MEDICATION ───────────────────────────────────── */}
            {showAddMedModal && (
                <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up-fade p-6 lg:p-8 space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                    <Pill className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-extrabold text-slate-900">Add Prescribed Medication</h3>
                            </div>
                            <button onClick={() => setShowAddMedModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddMedication} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Medication & Molecule Name</label>
                                <input
                                    required
                                    placeholder="e.g. Amoxicillin / Clavulanate (Augmentin)"
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-600"
                                    value={newMed.name}
                                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Therapeutic Dosage</label>
                                    <input
                                        required
                                        placeholder="e.g. 625 mg, 40 mg, 10 ml"
                                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-600"
                                        value={newMed.dosage}
                                        onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Schedule & Food Timing</label>
                                    <input
                                        required
                                        placeholder="e.g. Twice daily after meals"
                                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-600"
                                        value={newMed.frequency}
                                        onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Course Duration</label>
                                <input
                                    placeholder="e.g. 5 days, 7 days, 14 days"
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-600"
                                    value={newMed.duration}
                                    onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Clinical Instructions & Safety</label>
                                <input
                                    placeholder="e.g. Take with plenty of water. Complete full course."
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-600"
                                    value={newMed.instructions}
                                    onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddMedModal(false)}
                                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100"
                                >
                                    Add Drug
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── MODAL: PAST PATIENT MEDICAL RECORDS ──────────────────────── */}
            {showRecordsModal && (
                <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up-fade p-6 lg:p-8 space-y-5 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                    <FolderArchive className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Patient's Past Uploaded Records</h3>
                                    <p className="text-xs text-slate-400">Scans and reports uploaded by {patientName}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowRecordsModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto space-y-3 flex-1">
                            {patientRecords.map((rec) => (
                                <div key={rec._id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">{rec.title}</p>
                                        <p className="text-xs text-slate-400">{rec.category} · {new Date(rec.date).toLocaleDateString()}</p>
                                        {rec.doctorNotes && <p className="text-xs text-slate-600 mt-1 italic">"{rec.doctorNotes}"</p>}
                                    </div>
                                    <button
                                        onClick={() => handleInspectRecord(rec._id)}
                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 hover:bg-indigo-700"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> View
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: VIEW SPECIFIC DOCUMENT ────────────────────────────── */}
            {viewingRecord && (
                <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h4 className="font-bold text-slate-900 text-sm">{viewingRecord.title}</h4>
                            <button onClick={() => setViewingRecord(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {viewingRecord.fileUrl ? (
                            <img src={viewingRecord.fileUrl} alt="Doc" className="max-h-96 w-auto mx-auto rounded-xl object-contain border" />
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-6">No image attached.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScribeFlow;
