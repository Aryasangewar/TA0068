import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ScribeFlow from '../components/ScribeFlow';
import {
    getCases,
    updateCaseStatus,
    getDoctorConsentRequests,
    getPatientProfileById,
    getPatientMedicalRecords,
    getMedicalRecordById
} from '../services/data';

import {
    Users, PlusCircle, History, LayoutDashboard, Settings, Search,
    Bell, Clock, ArrowUpRight, Filter, MoreVertical, Activity,
    CheckCircle2, Timer, X, ChevronDown, Pill, Clipboard,
    MessageSquare, Image as ImageIcon, FileText, AlertCircle, Loader2,
    User, FolderArchive, Download, Eye, HeartPulse, ShieldCheck,
    Copy, Check, ExternalLink, Lock, Calendar, MapPin, Phone, Mail,
    AlertTriangle, Sparkles, CheckCircle, Shield
} from 'lucide-react';

const DoctorDashboard = () => {
    const [view, setView] = useState('dashboard');
    const [cases, setCases] = useState([]);
    const [consents, setConsents] = useState([]);
    const [filteredCases, setFilteredCases] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    // Modals & Details State
    const [selectedCase, setSelectedCase] = useState(null);
    const [selectedPatientForDossier, setSelectedPatientForDossier] = useState(null);
    const [viewingRecordDoc, setViewingRecordDoc] = useState(null);
    const [loadingDoc, setLoadingDoc] = useState(false);
    const [scribeInitialPatientId, setScribeInitialPatientId] = useState('');

    const navigate = useNavigate();
    const doctorInfo = JSON.parse(sessionStorage.getItem('userInfo'));

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const [casesData, consentsData] = await Promise.all([
                getCases().catch(err => {
                    console.error('Failed to fetch cases:', err);
                    return [];
                }),
                getDoctorConsentRequests().catch(err => {
                    console.error('Failed to fetch doctor consents:', err);
                    return [];
                })
            ]);

            setCases(casesData || []);
            setConsents(consentsData || []);
            const completed = (casesData || []).filter(c => c.status === 'Completed').length;
            setStats({
                total: (casesData || []).length,
                active: (casesData || []).length - completed,
                completed
            });
        } catch (err) {
            console.error('Failed to fetch clinical dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Apply search & filter on cases
    useEffect(() => {
        let result = [...cases];
        if (statusFilter !== 'All') result = result.filter(c => c.status === statusFilter);
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.patientId?.name?.toLowerCase().includes(q) ||
                c._id?.toLowerCase().includes(q) ||
                c.structuredData?.diagnosis?.toLowerCase().includes(q)
            );
        }
        setFilteredCases(result);
    }, [cases, searchTerm, statusFilter]);

    const handleMarkComplete = async (id) => {
        try {
            await updateCaseStatus(id, 'Completed');
            fetchDashboardData();
        } catch (err) {
            alert('Failed to update: ' + (err.response?.data?.message || err.message));
        }
    };

    // Merged unique patients from both cases and consent requests/connections
    const uniquePatients = useMemo(() => {
        const patientMap = new Map();

        // 1. From consents (has populated profile fields from patient-request or approved consent)
        consents.forEach(cs => {
            if (cs.patientId && cs.patientId._id) {
                const pId = String(cs.patientId._id);
                patientMap.set(pId, {
                    ...cs.patientId,
                    consentStatus: cs.status,
                    allowedFields: cs.allowedFields || [],
                    consentExpiresAt: cs.expiresAt,
                    consentId: cs._id,
                });
            }
        });

        // 2. From cases (enrich or add)
        cases.forEach(c => {
            if (c.patientId && c.patientId._id) {
                const pId = String(c.patientId._id);
                const existing = patientMap.get(pId);
                patientMap.set(pId, {
                    ...(existing || {}),
                    ...c.patientId,
                    consentStatus: existing?.consentStatus || 'Approved',
                    allowedFields: existing?.allowedFields || ['diagnosis', 'medicines', 'advice', 'prescriptionImage', 'resolutionNotes', 'pastRecords', 'patientProfile'],
                });
            }
        });

        return Array.from(patientMap.values());
    }, [cases, consents]);

    // Filtered patients for directory search
    const filteredPatients = useMemo(() => {
        if (!patientSearchTerm.trim()) return uniquePatients;
        const q = patientSearchTerm.toLowerCase();
        return uniquePatients.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.city?.toLowerCase().includes(q) ||
            p.bloodGroup?.toLowerCase().includes(q) ||
            p.allergies?.toLowerCase().includes(q)
        );
    }, [uniquePatients, patientSearchTerm]);

    const archivedCases = cases.filter(c => c.status === 'Completed');

    const handleInspectRecordDoc = async (recordId) => {
        try {
            setLoadingDoc(true);
            const fullDoc = await getMedicalRecordById(recordId);
            setViewingRecordDoc(fullDoc);
        } catch (err) {
            alert('Failed to load document: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoadingDoc(false);
        }
    };

    const handleStartConsultationWithPatient = (patient) => {
        const id = patient._id || patient.id;
        setScribeInitialPatientId(String(id));
        setSelectedPatientForDossier(null);
        setSelectedCase(null);
        setView('new-scribe');
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] bg-[#F3F4F6]">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden lg:flex sticky top-20 h-[calc(100vh-80px)]">
                <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4">Menu</p>
                        <nav className="space-y-1">
                            <SidebarLink
                                active={view === 'dashboard'}
                                onClick={() => setView('dashboard')}
                                icon={<LayoutDashboard className="w-5 h-5" />}
                                label="Clinical Overview"
                            />
                            <SidebarLink
                                active={view === 'new-scribe'}
                                onClick={() => { setScribeInitialPatientId(''); setView('new-scribe'); }}
                                icon={<PlusCircle className="w-5 h-5" />}
                                label="New Consultation"
                            />
                            <SidebarLink
                                active={view === 'patients'}
                                onClick={() => setView('patients')}
                                icon={<Users className="w-5 h-5" />}
                                label="Patient Directory"
                                badge={uniquePatients.length || null}
                            />
                            <SidebarLink
                                active={view === 'archives'}
                                onClick={() => setView('archives')}
                                icon={<History className="w-5 h-5" />}
                                label="Case Archives"
                                badge={archivedCases.length || null}
                            />
                        </nav>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4">Settings</p>
                        <nav className="space-y-1">
                            <SidebarLink
                                active={false}
                                onClick={() => navigate('/profile')}
                                icon={<User className="w-5 h-5 text-indigo-600" />}
                                label="Doctor Profile & Bio"
                            />
                            <SidebarLink
                                active={view === 'settings'}
                                onClick={() => setView('settings')}
                                icon={<Settings className="w-5 h-5" />}
                                label="Scribe Settings"
                            />
                            <SidebarLink
                                active={view === 'notifications'}
                                onClick={() => setView('notifications')}
                                icon={<Bell className="w-5 h-5" />}
                                label="Notifications"
                            />
                        </nav>
                    </div>
                </div>

                {/* Doctor Identity */}
                <div
                    onClick={() => navigate('/profile')}
                    className="p-5 border-t border-slate-100 bg-slate-50/70 hover:bg-indigo-50/50 cursor-pointer transition flex items-center justify-between group"
                    title="Click to view & edit your Doctor Profile"
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-100 group-hover:scale-105 transition shrink-0">
                            {doctorInfo?.name?.charAt(0) || 'D'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">Dr. {doctorInfo?.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                                {doctorInfo?.specialization || 'Medical Professional'}
                            </p>
                        </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition shrink-0" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-10 space-y-10 overflow-auto">

                {/* ─── VIEW: DASHBOARD ──────────────────────────────────────── */}
                {view === 'dashboard' && (
                    <>
                        {/* Header */}
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Physician Dashboard</h1>
                                <p className="text-slate-500 font-medium mt-1">
                                    Clinical Overview & Consultation Records · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 animate-fade-in delay-1">
                                <div className="bg-white p-2 border border-slate-200 rounded-2xl flex items-center gap-2 shadow-sm">
                                    <Search className="w-5 h-5 text-slate-400 ml-2" />
                                    <input
                                        type="text"
                                        placeholder="Search cases & diagnosis..."
                                        className="bg-transparent border-none outline-none text-sm w-48 font-medium"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="p-1 text-slate-300 hover:text-slate-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setScribeInitialPatientId(''); setView('new-scribe'); }}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    New Scribe
                                </button>
                            </div>
                        </header>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <StatCard title="Total Consultations" value={loading ? '—' : stats.total} icon={<Activity className="w-6 h-6 text-indigo-600" />} bg="bg-indigo-50" trend="All practice records" />
                            <StatCard title="Active Portals" value={loading ? '—' : stats.active} icon={<Timer className="w-6 h-6 text-amber-600" />} bg="bg-amber-50" trend="Requires clinical entry" />
                            <StatCard title="Verified Archives" value={loading ? '—' : stats.completed} icon={<CheckCircle2 className="w-6 h-6 text-teal-600" />} bg="bg-teal-50" trend="Documented & finalized" />
                        </div>

                        {/* Cases Table */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-slate-400" />
                                    Recent Consultation Encounters
                                </h2>
                                <div className="flex items-center gap-2 relative">
                                    <button
                                        onClick={() => setShowFilterMenu(p => !p)}
                                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 px-4 text-sm font-bold"
                                    >
                                        <Filter className="w-4 h-4" />
                                        {statusFilter}
                                        <ChevronDown className={`w-3 h-3 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showFilterMenu && (
                                        <div className="absolute top-12 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200 overflow-hidden z-50 min-w-[140px]">
                                            {['All', 'Active', 'Completed'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => { setStatusFilter(f); setShowFilterMenu(false); }}
                                                    className={`w-full text-left px-6 py-3 text-sm font-bold transition hover:bg-indigo-50 ${statusFilter === f ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => { setStatusFilter('All'); setSearchTerm(''); }}
                                        className="text-indigo-600 text-sm font-bold px-4 py-2 hover:bg-blue-50 rounded-xl transition"
                                    >
                                        View All
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-8 py-5">Patient Identity</th>
                                            <th className="px-8 py-5">Clinical Diagnosis</th>
                                            <th className="px-8 py-5">Encounter Time</th>
                                            <th className="px-8 py-5">Portal Status</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr><td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-bold italic animate-pulse">Synchronizing clinical data...</td></tr>
                                        ) : filteredCases.length === 0 ? (
                                            <tr><td colSpan="5" className="px-8 py-16 text-center text-slate-400">
                                                {cases.length === 0 ? 'No consultations yet. Start a new scribe session.' : 'No cases match your filter.'}
                                            </td></tr>
                                        ) : (
                                            filteredCases.map((c) => (
                                                <tr key={c._id} className="hover:bg-slate-50/50 transition cursor-pointer group" onClick={() => setSelectedCase(c)}>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 font-bold text-sm">
                                                                {c.patientId?.name?.substring(0, 2).toUpperCase() || 'P'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">{c.patientId?.name || 'Anonymous Patient'}</p>
                                                                <p className="text-[10px] text-slate-400 font-medium">{c.patientId?.email || ''}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="font-extrabold text-slate-800 text-sm">
                                                            {c.structuredData?.diagnosis || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <p className="text-sm font-bold text-slate-700">{new Date(c.createdAt).toLocaleDateString()}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${c.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            <div className={`w-1 h-1 rounded-full ${c.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right whitespace-nowrap space-x-2" onClick={(e) => e.stopPropagation()}>
                                                        {c.status === 'Active' && (
                                                            <button
                                                                onClick={() => handleMarkComplete(c._id)}
                                                                className="text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 hover:bg-teal-600 hover:text-white transition"
                                                            >
                                                                Finalize
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setSelectedCase(c)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                            title="View case details & transcript"
                                                        >
                                                            <ArrowUpRight className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}

                {/* ─── VIEW: NEW SCRIBE ─────────────────────────────────────── */}
                {view === 'new-scribe' && (
                    <div className="animate-fade-in">
                        <header className="flex items-center justify-between mb-10">
                            <div>
                                <button
                                    onClick={() => setView('dashboard')}
                                    className="text-indigo-600 text-sm font-bold flex items-center gap-2 mb-4 hover:gap-1 transition-all"
                                >
                                    <ArrowUpRight className="w-4 h-4 rotate-[225deg]" />
                                    Back to Overview
                                </button>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Clinical Port Initialize</h1>
                            </div>
                        </header>
                        <ScribeFlow
                            onComplete={() => { fetchDashboardData(); setView('dashboard'); }}
                            initialPatientId={scribeInitialPatientId}
                        />
                    </div>
                )}

                {/* ─── VIEW: PATIENT DIRECTORY ──────────────────────────────── */}
                {view === 'patients' && (
                    <div className="animate-fade-in space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Directory</h1>
                                <p className="text-slate-500 font-medium text-sm mt-1">
                                    Authorized clinical patient profiles and past records
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-2 border border-slate-200 rounded-2xl flex items-center gap-2 shadow-sm">
                                    <Search className="w-5 h-5 text-slate-400 ml-2" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, allergies, city..."
                                        className="bg-transparent border-none outline-none text-sm w-64 font-medium"
                                        value={patientSearchTerm}
                                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                                    />
                                    {patientSearchTerm && (
                                        <button onClick={() => setPatientSearchTerm('')} className="p-1 text-slate-300 hover:text-slate-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm">
                                    {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {filteredPatients.length === 0 ? (
                            <div className="bg-white rounded-[2rem] border border-slate-200 p-20 text-center space-y-4 shadow-sm">
                                <Users className="w-16 h-16 text-slate-200 mx-auto" />
                                <p className="text-slate-400 font-bold">
                                    {uniquePatients.length === 0
                                        ? 'No patients connected yet. When patients book consultation or grant consent, they appear here.'
                                        : 'No patients found matching your search term.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredPatients.map((p, i) => p && (
                                    <div
                                        key={p._id || i}
                                        className="bg-white rounded-[2.5rem] border border-slate-200 p-7 space-y-5 hover:shadow-xl hover:border-indigo-100 transition group flex flex-col justify-between"
                                    >
                                        <div className="space-y-4">
                                            {/* Patient Header */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm group-hover:scale-105 transition">
                                                        {p.name?.charAt(0) || 'P'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-900 text-lg group-hover:text-indigo-600 transition">{p.name}</h4>
                                                        <p className="text-xs text-slate-400 font-medium truncate max-w-[180px]">{p.email}</p>
                                                    </div>
                                                </div>

                                                {p.consentStatus === 'Approved' ? (
                                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                                                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Authorized
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                                                        <Clock className="w-3 h-3 text-amber-600" /> Pending
                                                    </span>
                                                )}
                                            </div>

                                            {/* Demographics & Blood Group Chips */}
                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                {p.bloodGroup && p.bloodGroup !== 'RESTRICTED' && (
                                                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-black">
                                                        🩸 {p.bloodGroup}
                                                    </span>
                                                )}
                                                {p.gender && (
                                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                                                        {p.gender}
                                                    </span>
                                                )}
                                                {p.city && (
                                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" /> {p.city}
                                                    </span>
                                                )}
                                                {p.phoneNumber && (
                                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                                        📞 {p.phoneNumber}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Clinical Alerts (Allergies / Conditions) */}
                                            <div className="space-y-1.5 pt-1">
                                                {p.allergies === 'RESTRICTED' ? (
                                                    <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold flex items-center gap-2">
                                                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>Allergies: Restricted by patient</span>
                                                    </div>
                                                ) : p.allergies ? (
                                                    <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                        <span className="truncate">Allergies: {p.allergies}</span>
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-1 bg-emerald-50/70 border border-emerald-100 rounded-xl text-[11px] text-emerald-700 font-medium">
                                                        ✓ No Known Drug Allergies
                                                    </div>
                                                )}

                                                {p.chronicConditions && p.chronicConditions !== 'RESTRICTED' && (
                                                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 line-clamp-1">
                                                        <span className="font-bold text-slate-700">Chronic: </span>{p.chronicConditions}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Actions */}
                                        <div className="pt-4 border-t border-slate-100 space-y-2">
                                            <button
                                                onClick={() => setSelectedPatientForDossier(p)}
                                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md shadow-indigo-100"
                                            >
                                                <FolderArchive className="w-4 h-4" />
                                                <span>Medical Profile & Records</span>
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => { setSearchTerm(p.name); setView('dashboard'); }}
                                                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition text-center"
                                                >
                                                    Cases ({cases.filter(c => c.patientId?._id === p._id || c.patientId === p._id).length})
                                                </button>
                                                <button
                                                    onClick={() => handleStartConsultationWithPatient(p)}
                                                    className="py-2 px-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                                    title="Start Consultation with this patient"
                                                >
                                                    <PlusCircle className="w-3.5 h-3.5" />
                                                    <span>Consult</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── VIEW: ARCHIVES ───────────────────────────────────────── */}
                {view === 'archives' && (
                    <div className="animate-fade-in space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Case Archives</h1>
                                <p className="text-slate-500 font-medium text-sm mt-1">Finalized consultations with complete transcription</p>
                            </div>
                            <span className="text-sm text-slate-500 font-medium">{archivedCases.length} archived</span>
                        </div>
                        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-5">Patient</th>
                                        <th className="px-8 py-5">Diagnosis</th>
                                        <th className="px-8 py-5">Date</th>
                                        <th className="px-8 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {archivedCases.length === 0 ? (
                                        <tr><td colSpan="4" className="px-8 py-12 text-center text-slate-400 font-bold">No archived cases yet.</td></tr>
                                    ) : (
                                        archivedCases.map(c => (
                                            <tr key={c._id} className="hover:bg-slate-50/50 transition cursor-pointer group" onClick={() => setSelectedCase(c)}>
                                                <td className="px-8 py-5 font-bold text-slate-900">{c.patientId?.name || 'N/A'}</td>
                                                <td className="px-8 py-5 text-slate-600 text-sm italic font-semibold">{c.structuredData?.diagnosis || '—'}</td>
                                                <td className="px-8 py-5 text-slate-400 text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
                                                <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={() => setSelectedCase(c)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                                        <ArrowUpRight className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── VIEW: SETTINGS ───────────────────────────────────────── */}
                {view === 'settings' && (
                    <div className="animate-fade-in space-y-8 max-w-2xl">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Scribe Settings</h1>
                        <div className="bg-white rounded-[2rem] border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
                            <SettingRow
                                label="Speech Recognition Language"
                                desc="Language used for voice-to-text transcription"
                                control={
                                    <select className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 outline-none focus:border-indigo-500">
                                        <option>English (US)</option>
                                        <option>English (UK)</option>
                                        <option>Urdu</option>
                                        <option>Arabic</option>
                                    </select>
                                }
                            />
                            <SettingRow
                                label="AI Clinical Model"
                                desc="LLM provider powering structured extraction"
                                control={
                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                        Gemini 2.5 Flash
                                    </span>
                                }
                            />
                            <SettingRow
                                label="Patient Consent Enforcement"
                                desc="Strict privacy filtering based on patient data nodes"
                                control={
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <div className="w-12 h-6 bg-indigo-600 rounded-full" />
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                    </label>
                                }
                            />
                        </div>
                        <p className="text-xs text-slate-400 italic">Settings are saved to your profile automatically.</p>
                    </div>
                )}

                {/* ─── VIEW: NOTIFICATIONS ──────────────────────────────────── */}
                {view === 'notifications' && (
                    <div className="animate-fade-in space-y-8 max-w-2xl">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
                        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                            {stats.active > 0 ? (
                                <div className="p-8 flex items-start gap-5">
                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                                        <AlertCircle className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Active Cases Need Attention</p>
                                        <p className="text-sm text-slate-500 mt-1">You have <strong>{stats.active}</strong> active consultation(s) that haven't been finalized yet.</p>
                                        <button onClick={() => { setView('dashboard'); setStatusFilter('Active'); }} className="mt-4 text-sm font-bold text-indigo-600 hover:underline">
                                            View Active Cases →
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-16 text-center space-y-3">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto" />
                                    <p className="text-slate-400 font-bold">All caught up! No notifications.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <footer className="mt-20 pt-10 border-t border-slate-200 text-center pb-10">
                    <p className="text-[10px] font-black text-indigo-500/30 uppercase tracking-[0.2em] italic">Design and Developed by Mohsin, Wasif, Furqan, Arya, Tamanna</p>
                </footer>
            </main>

            {/* ─── Case Detail Modal (With Transcript & Scans) ───────────── */}
            {selectedCase && (
                <CaseDetailModal
                    caseData={selectedCase}
                    onClose={() => setSelectedCase(null)}
                    onOpenDossier={(p) => setSelectedPatientForDossier(p)}
                    onInspectRecordDoc={handleInspectRecordDoc}
                />
            )}

            {/* ─── Patient Dossier & Document Archive Modal ─────────────────── */}
            {selectedPatientForDossier && (
                <PatientDossierModal
                    patient={selectedPatientForDossier}
                    allCases={cases}
                    onClose={() => setSelectedPatientForDossier(null)}
                    onStartScribe={handleStartConsultationWithPatient}
                    onInspectRecordDoc={handleInspectRecordDoc}
                    onViewCase={(c) => {
                        setSelectedPatientForDossier(null);
                        setSelectedCase(c);
                    }}
                />
            )}

            {/* ─── Physical Document & Scan Viewer Modal ─────────────────────── */}
            {viewingRecordDoc && (
                <DocumentPreviewModal
                    record={viewingRecordDoc}
                    onClose={() => setViewingRecordDoc(null)}
                />
            )}
        </div>
    );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const SidebarLink = ({ active, onClick, icon, label, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
    >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        {badge > 0 && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {badge}
            </span>
        )}
    </button>
);

const StatCard = ({ title, value, icon, bg, trend }) => (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg}`}>{icon}</div>
            <MoreVertical className="w-5 h-5 text-slate-300" />
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-4xl font-extrabold text-slate-900 tracking-tighter">{value}</h3>
        </div>
        <div className="pt-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{trend}</p>
        </div>
    </div>
);

const SettingRow = ({ label, desc, control }) => (
    <div className="flex items-center justify-between p-8 gap-8">
        <div>
            <p className="font-bold text-slate-900 text-sm">{label}</p>
            <p className="text-xs text-slate-400 mt-1">{desc}</p>
        </div>
        {control}
    </div>
);

// ─── Case Detail Modal ───────────────────────────────────────────────────────
const CaseDetailModal = ({ caseData: c, onClose, onOpenDossier, onInspectRecordDoc }) => {
    const [patientRecords, setPatientRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [recordsRestricted, setRecordsRestricted] = useState(false);
    const [copiedTranscript, setCopiedTranscript] = useState(false);

    const patientId = c.patientId?._id || c.patientId;

    useEffect(() => {
        if (patientId) {
            setLoadingRecords(true);
            setRecordsRestricted(false);
            getPatientMedicalRecords(patientId)
                .then(recs => setPatientRecords(recs || []))
                .catch(err => {
                    if (err.response?.status === 403) {
                        setRecordsRestricted(true);
                    }
                })
                .finally(() => setLoadingRecords(false));
        }
    }, [patientId]);

    const handleCopyTranscript = () => {
        if (!c.transcript) return;
        navigator.clipboard.writeText(c.transcript);
        setCopiedTranscript(true);
        setTimeout(() => setCopiedTranscript(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col animate-slide-up-fade">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{c.patientId?.name || 'Patient'}</h3>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${c.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                {c.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1">Case #{c._id} · {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-400 hover:text-rose-500 transition border border-slate-200 shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto p-8 space-y-8 flex-1">
                    {/* 1. Patient Profile & Clinical Vitals Bar */}
                    <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 border border-indigo-100 rounded-3xl p-6 space-y-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm">
                                    {c.patientId?.name?.charAt(0) || 'P'}
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Patient Clinical Snapshot</p>
                                    <p className="text-sm font-bold text-slate-900">{c.patientId?.name}</p>
                                </div>
                            </div>
                            {c.patientId && (
                                <button
                                    onClick={() => onOpenDossier(c.patientId)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
                                >
                                    <FolderArchive className="w-3.5 h-3.5" />
                                    <span>Inspect Full Medical Dossier & Past Uploads →</span>
                                </button>
                            )}
                        </div>

                        {/* Vitals row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            <div className="bg-white/80 p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Group</span>
                                <span className="text-sm font-extrabold text-slate-800">
                                    {c.patientId?.bloodGroup === 'RESTRICTED' ? '🔒 Restricted' : (c.patientId?.bloodGroup || 'Not recorded')}
                                </span>
                            </div>
                            <div className="bg-white/80 p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender / Age</span>
                                <span className="text-sm font-extrabold text-slate-800">
                                    {c.patientId?.gender || 'N/A'}{c.patientId?.dateOfBirth ? ` · ${new Date().getFullYear() - new Date(c.patientId.dateOfBirth).getFullYear()}y` : ''}
                                </span>
                            </div>
                            <div className="bg-white/80 p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Phone</span>
                                <span className="text-sm font-extrabold text-slate-800">
                                    {c.patientId?.phoneNumber || 'N/A'}
                                </span>
                            </div>
                            <div className="bg-white/80 p-3 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location</span>
                                <span className="text-sm font-extrabold text-slate-800">
                                    {c.patientId?.city || 'N/A'}
                                </span>
                            </div>
                        </div>

                        {/* Allergy and Conditions warnings */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            {c.patientId?.allergies === 'RESTRICTED' ? (
                                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Allergies Restricted by Patient
                                </span>
                            ) : c.patientId?.allergies ? (
                                <span className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Allergies: {c.patientId.allergies}
                                </span>
                            ) : (
                                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-medium">
                                    ✓ No Known Drug Allergies
                                </span>
                            )}

                            {c.patientId?.chronicConditions && c.patientId.chronicConditions !== 'RESTRICTED' && (
                                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium">
                                    Chronic: {c.patientId.chronicConditions}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 2. Audio Scribe Transcription */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-600" /> Audio Scribe Consultation Transcription
                            </p>
                            {c.transcript && (
                                <button
                                    onClick={handleCopyTranscript}
                                    className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                                >
                                    {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedTranscript ? 'Copied!' : 'Copy Transcript'}</span>
                                </button>
                            )}
                        </div>

                        {c.transcript ? (
                            <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl font-mono text-xs leading-relaxed max-h-56 overflow-y-auto border border-slate-800 shadow-inner">
                                <p className="whitespace-pre-wrap">{c.transcript}</p>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs italic">
                                No raw transcription recorded for this case (direct clinical entry).
                            </div>
                        )}
                    </div>

                    {/* 3. Prescription Scan Artifact */}
                    {c.prescriptionImage && (
                        <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-indigo-600" /> Attached Prescription Scan Artifact
                            </p>
                            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col sm:flex-row items-center gap-6">
                                <img
                                    src={c.prescriptionImage}
                                    alt="Prescription Scan"
                                    className="max-h-48 w-auto rounded-2xl object-contain border border-slate-200 shadow-md bg-white"
                                />
                                <div className="space-y-3 text-center sm:text-left">
                                    <p className="text-xs font-bold text-slate-700">Clinical Prescription Document</p>
                                    <p className="text-[11px] text-slate-400">Captured and digitized during consultation.</p>
                                    <a
                                        href={c.prescriptionImage}
                                        download={`prescription-${c._id.slice(-8)}.png`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download Prescription Image</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. AI Structured Diagnostic Synthesis */}
                    {c.structuredData ? (
                        <div className="space-y-6">
                            {/* Diagnosis */}
                            <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Clipboard className="w-3.5 h-3.5" /> Clinical Diagnosis
                                </p>
                                <p className="text-xl font-black text-indigo-950 italic">{c.structuredData.diagnosis}</p>
                            </div>

                            {/* Symptoms */}
                            {c.structuredData.symptoms?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Observed Symptoms</p>
                                    <div className="flex flex-wrap gap-2">
                                        {c.structuredData.symptoms.map((s, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Medicines */}
                            {c.structuredData.medicines?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Pill className="w-3.5 h-3.5" /> Prescribed Medications
                                    </p>
                                    <div className="space-y-2">
                                        {c.structuredData.medicines.map((m, i) => (
                                            <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
                                                <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                                                <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg">{m.dosage} · {m.frequency}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Advice */}
                            {c.structuredData.advice && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5" /> Lifestyle & Treatment Advisory
                                    </p>
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                        <p className="text-slate-700 font-medium italic text-sm leading-relaxed">{c.structuredData.advice}</p>
                                    </div>
                                </div>
                            )}

                            {/* Resolution Notes */}
                            {c.resolutionNotes && c.resolutionNotes !== 'RESTRICTED' && (
                                <div className="bg-slate-900 rounded-2xl p-5 text-white">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Encounter Resolution Notes</p>
                                    <p className="text-sm font-semibold">{c.resolutionNotes}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-400 text-sm font-medium">
                            No structured data processed for this case.
                        </div>
                    )}

                    {/* 5. Patient's Past Uploaded Records & Documents */}
                    <div className="pt-6 border-t border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                    <FolderArchive className="w-5 h-5 text-indigo-600" />
                                    <span>Patient's Past Medical Documents & Scans</span>
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5">Documents, lab reports, and imaging uploaded by the patient</p>
                            </div>
                            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl">
                                {patientRecords.length} document{patientRecords.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {loadingRecords ? (
                            <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-xs font-medium">Loading patient documents...</span>
                            </div>
                        ) : recordsRestricted ? (
                            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-bold">
                                <Lock className="w-5 h-5 shrink-0 text-amber-600" />
                                <span>The patient has not granted permission to view past medical records in this consent agreement.</span>
                            </div>
                        ) : patientRecords.length === 0 ? (
                            <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                                Patient has not uploaded any past medical documents yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {patientRecords.map((rec) => (
                                    <div key={rec._id} className="p-5 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl space-y-3 transition hover:shadow-md">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-black uppercase tracking-wider">
                                                    {rec.category || 'Record'}
                                                </span>
                                                <p className="font-extrabold text-slate-900 text-sm mt-1">{rec.title}</p>
                                                <p className="text-[11px] text-slate-400">
                                                    {new Date(rec.recordDate || rec.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                                        </div>
                                        {rec.notes && (
                                            <p className="text-xs text-slate-600 line-clamp-2 italic bg-white/60 p-2 rounded-xl">"{rec.notes}"</p>
                                        )}
                                        <button
                                            onClick={() => onInspectRecordDoc(rec._id)}
                                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>Inspect / Download Artifact</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="text-xs text-slate-400">Clinical Record #{c._id.slice(-8)}</span>
                    <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-indigo-600 transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Patient Dossier & Document Archive Modal ────────────────────────────────
const PatientDossierModal = ({ patient, allCases, onClose, onStartScribe, onInspectRecordDoc, onViewCase }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(patient);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recordsRestricted, setRecordsRestricted] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const patientId = patient._id || patient.id;

    useEffect(() => {
        if (patientId) {
            setLoading(true);
            setRecordsRestricted(false);
            Promise.all([
                getPatientProfileById(patientId).catch(err => {
                    console.warn('Profile fetch note:', err);
                    return patient;
                }),
                getPatientMedicalRecords(patientId).catch(err => {
                    if (err.response?.status === 403) setRecordsRestricted(true);
                    return [];
                })
            ]).then(([profData, recsData]) => {
                if (profData) setProfile(profData);
                if (recsData) setRecords(recsData);
            }).finally(() => setLoading(false));
        }
    }, [patientId]);

    const patientCases = (allCases || []).filter(c => c.patientId?._id === patientId || c.patientId === patientId);

    const categories = ['All', 'Lab Report', 'Prescription', 'X-Ray', 'MRI', 'Vaccination', 'Doctor Note', 'Insurance', 'Other'];
    const filteredRecords = selectedCategory === 'All'
        ? records
        : records.filter(r => r.category === selectedCategory);

    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col animate-slide-up-fade">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-100 shrink-0">
                                {profile?.name?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{profile?.name}</h3>
                                    {profile?.bloodGroup && profile.bloodGroup !== 'RESTRICTED' && (
                                        <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-black">
                                            🩸 {profile.bloodGroup}
                                        </span>
                                    )}
                                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Authorized Dossier
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                                    <span>{profile?.email}</span>
                                    {profile?.phoneNumber && <span>· 📞 {profile.phoneNumber}</span>}
                                    {profile?.city && <span>· 📍 {profile.city}</span>}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-400 hover:text-rose-500 transition border border-slate-200 shadow-sm shrink-0">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>Clinical Profile & Vitals</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('records')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'records' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <FolderArchive className="w-3.5 h-3.5" />
                            <span>Past Records & Scans ({records.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <History className="w-3.5 h-3.5" />
                            <span>Consultation History ({patientCases.length})</span>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto flex-1 space-y-6">
                    {loading ? (
                        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            <p className="text-sm font-bold">Synchronizing patient record & history...</p>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: PROFILE & VITALS */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6 animate-fade-in">
                                    {/* Allergies Highlight */}
                                    {profile?.allergies === 'RESTRICTED' ? (
                                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl flex items-center gap-4">
                                            <Lock className="w-6 h-6 text-slate-400 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">Allergy Information Restricted</p>
                                                <p className="text-[11px] text-slate-400">The patient has chosen not to share detailed allergy disclosures.</p>
                                            </div>
                                        </div>
                                    ) : profile?.allergies ? (
                                        <div className="p-5 bg-rose-50 border-2 border-rose-200 rounded-3xl flex items-start gap-4">
                                            <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md shadow-rose-200">
                                                <AlertTriangle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">High Clinical Caution: Known Allergies</p>
                                                <p className="text-lg font-black text-rose-950 mt-0.5">{profile.allergies}</p>
                                                <p className="text-xs text-rose-700 mt-1">Verify drug cross-reactivity before prescribing.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center gap-4">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-emerald-800">No Known Drug Allergies (NKDA)</p>
                                                <p className="text-[11px] text-emerald-600">Patient reported no active medication or food sensitivities.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Demographics Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gender</p>
                                            <p className="font-extrabold text-slate-900">{profile?.gender || 'Not specified'}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Date of Birth</p>
                                            <p className="font-extrabold text-slate-900">
                                                {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not recorded'}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Blood Group</p>
                                            <p className="font-extrabold text-slate-900">{profile?.bloodGroup || 'Unknown'}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone Number</p>
                                            <p className="font-extrabold text-slate-900">{profile?.phoneNumber || 'Not provided'}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">City / Region</p>
                                            <p className="font-extrabold text-slate-900">{profile?.city || 'Not provided'}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Emergency Contact</p>
                                            <p className="font-extrabold text-slate-900">
                                                {profile?.emergencyContactName || 'N/A'}{profile?.emergencyContactPhone ? ` (${profile.emergencyContactPhone})` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Chronic Conditions */}
                                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Chronic & Ongoing Conditions</p>
                                        <p className="text-slate-800 font-semibold leading-relaxed">
                                            {profile?.chronicConditions === 'RESTRICTED'
                                                ? '🔒 Restricted by patient consent.'
                                                : (profile?.chronicConditions || 'None reported.')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: RECORDS & SCANS ARCHIVE */}
                            {activeTab === 'records' && (
                                <div className="space-y-6 animate-fade-in">
                                    {/* Category Filter Chips */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    {recordsRestricted ? (
                                        <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-2 text-amber-800">
                                            <Lock className="w-8 h-8 mx-auto text-amber-600" />
                                            <p className="font-bold text-sm">Patient Has Restricted Past Medical Records</p>
                                            <p className="text-xs text-amber-700">The patient has customized their consent permissions to withhold past personal uploads.</p>
                                        </div>
                                    ) : filteredRecords.length === 0 ? (
                                        <div className="p-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center space-y-2">
                                            <FolderArchive className="w-10 h-10 text-slate-300 mx-auto" />
                                            <p className="font-bold text-slate-600 text-sm">No documents found in this category.</p>
                                            <p className="text-xs text-slate-400">The patient has not uploaded files matching this filter.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {filteredRecords.map(doc => (
                                                <div key={doc._id} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 hover:shadow-lg transition">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold uppercase">
                                                            {doc.category || 'Record'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-900 text-sm">{doc.title}</h5>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            Encounter Date: {new Date(doc.recordDate || doc.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    {doc.notes && (
                                                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl line-clamp-2">
                                                            "{doc.notes}"
                                                        </p>
                                                    )}
                                                    <button
                                                        onClick={() => onInspectRecordDoc(doc._id)}
                                                        className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Inspect Document / Download</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: CONSULTATION HISTORY */}
                            {activeTab === 'history' && (
                                <div className="space-y-4 animate-fade-in">
                                    {patientCases.length === 0 ? (
                                        <div className="p-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center space-y-2">
                                            <History className="w-10 h-10 text-slate-300 mx-auto" />
                                            <p className="font-bold text-slate-600 text-sm">No previous consultations recorded.</p>
                                            <p className="text-xs text-slate-400">Click below to start the first consultation session with this patient.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {patientCases.map(c => (
                                                <div key={c._id} className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 hover:shadow-md transition">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-extrabold text-slate-900 text-sm">
                                                                {c.structuredData?.diagnosis || 'Consultation Encounter'}
                                                            </span>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${c.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                {c.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            Encounter Date: {new Date(c.createdAt).toLocaleDateString()} · ID #{c._id.slice(-8)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => onViewCase(c)}
                                                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                                    >
                                                        <span>View Case Details</span>
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <button
                        onClick={() => onStartScribe(profile)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-md shadow-indigo-100"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>Launch Scribe Consultation</span>
                    </button>
                    <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs hover:bg-slate-100 transition">
                        Close Dossier
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Physical Document & Scan Viewer Modal ───────────────────────────────────
const DocumentPreviewModal = ({ record: r, onClose }) => {
    if (!r) return null;

    const isImage = r.fileType?.startsWith('image/') || (r.fileData && r.fileData.startsWith('data:image'));

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl animate-fade-in">
            <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col animate-slide-up-fade">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-black uppercase">
                                {r.category || 'Record'}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-lg">{r.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Recorded on {new Date(r.recordDate || r.createdAt).toLocaleDateString()} · {r.fileName || 'document'}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {r.notes && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Patient Clinical Notes</p>
                            <p className="text-xs text-slate-700 leading-relaxed italic">{r.notes}</p>
                        </div>
                    )}

                    {r.fileData ? (
                        <div className="space-y-4">
                            {isImage ? (
                                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950/5 p-2 text-center">
                                    <img
                                        src={r.fileData}
                                        alt={r.title}
                                        className="max-h-[500px] w-auto mx-auto rounded-xl object-contain shadow-sm"
                                    />
                                </div>
                            ) : (
                                <div className="p-10 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-4">
                                    <FileText className="w-16 h-16 text-indigo-600 mx-auto" />
                                    <div>
                                        <p className="font-bold text-slate-900 text-base">{r.fileName || 'Attached Document File'}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{r.fileType || 'Medical file'}</p>
                                    </div>
                                    <a
                                        href={r.fileData}
                                        download={r.fileName || `${r.title}.pdf`}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition shadow-md shadow-indigo-100"
                                    >
                                        <Download className="w-4 h-4" /> Download / Open Document
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-10 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl">
                            No physical attachment file stored with this record entry.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    {r.fileData ? (
                        <a
                            href={r.fileData}
                            download={r.fileName || `${r.title}.png`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                            <Download className="w-3.5 h-3.5" /> Download Artifact
                        </a>
                    ) : <div />}
                    <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
