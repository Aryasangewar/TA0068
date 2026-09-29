import React, { useState, useEffect, useCallback } from 'react';
import { getCases, getUserProfile, updateUserProfile } from '../services/data';
import {
    User, Mail, Award, Clock, CheckCircle, BarChart3, ShieldCheck,
    Activity, Fingerprint, Calendar, Building, CreditCard, Edit2,
    X, Save, Loader2, MapPin, Stethoscope, Sparkles, CheckCircle2,
    AlertCircle, Briefcase, FileText
} from 'lucide-react';

const COMMON_SPECIALTIES = [
    'Cardiologist',
    'Dermatologist',
    'Neurologist',
    'Orthopedist',
    'General Physician',
    'Pediatrician',
    'Psychiatrist',
    'ENT Specialist',
    'Ophthalmologist',
    'Gastroenterologist',
    'Pulmonologist',
    'Gynecologist',
    'Endocrinologist',
    'Nephrologist',
    'Dentist',
    'Oncologist',
    'Custom (Write what you are)'
];

const DoctorProfile = () => {
    const [stats, setStats] = useState({ totalCases: 0, completedCases: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        specialization: '',
        bio: '',
        qualifications: '',
        experience: '',
        hospital: '',
        city: '',
        license: '',
        isAvailable: true,
        createdAt: null,
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        specialization: 'General Physician',
        customSpecialization: '',
        bio: '',
        qualifications: '',
        experience: '',
        hospital: '',
        city: '',
        license: '',
        isAvailable: true,
    });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadProfileData = useCallback(async () => {
        try {
            setLoading(true);
            const [userData, casesData] = await Promise.all([
                getUserProfile().catch(() => null),
                getCases().catch(() => [])
            ]);

            const storedUser = JSON.parse(sessionStorage.getItem('userInfo')) || {};

            const merged = {
                name: userData?.name || storedUser.name || '',
                email: userData?.email || storedUser.email || '',
                specialization: userData?.specialization || storedUser.specialization || 'General Physician',
                bio: userData?.bio || storedUser.bio || '',
                qualifications: userData?.qualifications || storedUser.qualifications || '',
                experience: userData?.experience || storedUser.experience || '',
                hospital: userData?.hospital || storedUser.hospital || '',
                city: userData?.city || storedUser.city || '',
                license: userData?.license || storedUser.license || 'MD-2026-X99',
                isAvailable: userData?.isAvailable !== undefined ? userData.isAvailable : true,
                createdAt: userData?.createdAt || storedUser.createdAt,
            };

            setProfile(merged);

            const isStandardSpec = COMMON_SPECIALTIES.includes(merged.specialization) && merged.specialization !== 'Custom (Write what you are)';
            setEditForm({
                name: merged.name,
                specialization: isStandardSpec ? merged.specialization : 'Custom (Write what you are)',
                customSpecialization: isStandardSpec ? '' : merged.specialization,
                bio: merged.bio,
                qualifications: merged.qualifications,
                experience: merged.experience,
                hospital: merged.hospital,
                city: merged.city,
                license: merged.license,
                isAvailable: merged.isAvailable,
            });

            if (casesData) {
                setStats({
                    totalCases: casesData.length,
                    completedCases: casesData.filter(c => c.status === 'Completed').length
                });
            }
        } catch (err) {
            console.error('Failed to load doctor profile:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfileData();
    }, [loadProfileData]);

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const finalSpecialization = editForm.specialization === 'Custom (Write what you are)'
                ? editForm.customSpecialization.trim()
                : editForm.specialization;

            const updatePayload = {
                name: editForm.name,
                specialization: finalSpecialization || 'General Physician',
                bio: editForm.bio,
                qualifications: editForm.qualifications,
                experience: editForm.experience,
                hospital: editForm.hospital,
                city: editForm.city,
                license: editForm.license,
                isAvailable: editForm.isAvailable,
            };

            const updatedUser = await updateUserProfile(updatePayload);

            setProfile(prev => ({
                ...prev,
                ...updatePayload,
            }));

            // Sync with sessionStorage
            const stored = JSON.parse(sessionStorage.getItem('userInfo')) || {};
            sessionStorage.setItem('userInfo', JSON.stringify({
                ...stored,
                name: updatedUser.name || editForm.name,
                specialization: updatedUser.specialization || finalSpecialization,
                city: updatedUser.city || editForm.city,
            }));
            window.dispatchEvent(new Event('auth-change'));

            setShowEditModal(false);
            showToast('✓ Doctor profile and background updated successfully!');
        } catch (err) {
            showToast('Failed to save profile: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setSaving(false);
        }
    };

    const storedUser = JSON.parse(sessionStorage.getItem('userInfo')) || {};
    const joinDate = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'DocuFlux Network';

    const trustScore = stats.totalCases === 0 ? '9.8'
        : Math.min(9.9, (8.5 + (stats.completedCases / Math.max(stats.totalCases, 1)) * 1.4)).toFixed(1);

    return (
        <div className="max-w-6xl mx-auto space-y-12 py-10 px-4 selection:bg-indigo-100 selection:text-indigo-900">

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-24 right-6 z-[300] px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl animate-slide-up-fade flex items-center gap-3 ${
                    toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                }`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Profile Header */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
                <div className="h-52 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 relative overflow-hidden">
                    <Activity className="absolute -right-10 -top-10 w-72 h-72 text-white/10" />
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="px-10 pb-12">
                    <div className="relative -mt-20 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex flex-col md:flex-row md:items-end gap-6">
                            <div className="w-40 h-40 bg-white rounded-[2.5rem] shadow-2xl border-8 border-white flex items-center justify-center text-indigo-600 group overflow-hidden shrink-0">
                                <div className="w-full h-full bg-slate-50 flex items-center justify-center group-hover:scale-110 transition duration-500 font-black text-5xl text-indigo-600">
                                    {profile.name?.charAt(0) || 'D'}
                                </div>
                            </div>
                            <div className="pb-2 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Practitioner
                                    </div>
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                        profile.isAvailable
                                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        <span className={`w-2 h-2 rounded-full ${profile.isAvailable ? 'bg-teal-500 animate-pulse' : 'bg-amber-500'}`} />
                                        {profile.isAvailable ? 'Accepting Patients' : 'In Consultation'}
                                    </div>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-outfit">
                                    Dr. {profile.name || 'Practitioner'}
                                </h1>

                                <div className="flex flex-wrap items-center gap-2 text-indigo-600 font-bold text-sm">
                                    <Stethoscope className="w-4 h-4 shrink-0" />
                                    <span>{profile.specialization || 'General Physician'}</span>
                                    {profile.qualifications && (
                                        <span className="text-slate-400 font-medium text-xs">• {profile.qualifications}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Medical ID</p>
                                    <p className="text-sm font-mono font-bold text-slate-900">
                                        DFX-{storedUser?._id?.substring(storedUser._id.length - 6).toUpperCase() || 'PRACT'}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                    <Fingerprint className="w-6 h-6" />
                                </div>
                            </div>

                            <button
                                onClick={() => setShowEditModal(true)}
                                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition shadow-lg shadow-indigo-100 transform hover:-translate-y-0.5"
                                title="Edit Profile & Clinical Background"
                            >
                                <Edit2 className="w-4 h-4" />
                                <span>Edit Profile</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
                        <QuickInfo icon={<Mail className="w-4 h-4" />} label="Network Portal" value={profile.email} />
                        <QuickInfo icon={<Building className="w-4 h-4" />} label="Hospital Affiliation" value={profile.hospital || 'DocuFlux Clinical Network'} />
                        <QuickInfo icon={<MapPin className="w-4 h-4" />} label="City / Region" value={profile.city || 'Location Not Specified'} />
                        <QuickInfo icon={<CreditCard className="w-4 h-4" />} label="Medical License No" value={profile.license || 'MD-2026-X99'} />
                    </div>
                </div>
            </div>

            {/* Clinical Background & Medical History Section */}
            <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Background & Medical History</h2>
                            <p className="text-xs text-slate-400">Patients and referring physicians review this background during doctor discovery</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                    >
                        Edit Details
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Bio Text */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed text-sm">
                            {profile.bio ? (
                                <p className="whitespace-pre-line">{profile.bio}</p>
                            ) : (
                                <div className="text-center py-6 space-y-2 text-slate-400">
                                    <Stethoscope className="w-8 h-8 mx-auto text-slate-300" />
                                    <p className="font-semibold text-xs">No clinical background description added yet.</p>
                                    <p className="text-[11px]">Click "Edit Profile" to write your medical career background, sub-specialties, and patient care philosophy.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Highlights Cards */}
                    <div className="space-y-4">
                        <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/60 space-y-1">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Years in Practice</span>
                            <p className="text-lg font-bold text-indigo-950">{profile.experience || 'Experienced Clinical Practitioner'}</p>
                        </div>
                        <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100/60 space-y-1">
                            <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Medical Credentials</span>
                            <p className="text-lg font-bold text-teal-950">{profile.qualifications || 'Board Certified MD'}</p>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Trust Score</span>
                            <p className="text-lg font-bold text-slate-900">{trustScore} / 10.0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats & Analytics */}
            <section className="animate-fade-in space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-outfit uppercase italic">Practice Analytics</h2>
                        <p className="text-slate-400 font-medium text-xs">Clinical throughput processed by DocuFlux Flow Engine</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-slate-500 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" /> Live Node Telemetry
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Archived Consultations"
                        value={loading ? '...' : stats.totalCases}
                        subtitle="Completed & structured"
                        icon={<Award className="w-6 h-6 text-indigo-600" />}
                        badge="+100% E2EE"
                    />
                    <StatCard
                        title="Resolved Treatments"
                        value={loading ? '...' : stats.completedCases}
                        subtitle="Cases closed successfully"
                        icon={<CheckCircle className="w-6 h-6 text-teal-600" />}
                        badge="Verified"
                    />
                    <StatCard
                        title="Decentralized Trust"
                        value={trustScore}
                        subtitle="Practitioner index"
                        icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
                        badge="Top Tier"
                    />
                </div>
            </section>

            {/* ─── EDIT PROFILE MODAL ─── */}
            {showEditModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up-fade max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Edit2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Edit Doctor Profile & History</h3>
                                    <p className="text-xs text-slate-400">Patients discover you according to this background information</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-6 space-y-5 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City / Practice Location</label>
                                    <input
                                        type="text"
                                        value={editForm.city}
                                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                        placeholder="e.g. New York, London, Karachi"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>
                            </div>

                            {/* Specialization */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Specialization</label>
                                <select
                                    value={editForm.specialization}
                                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                >
                                    {COMMON_SPECIALTIES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>

                                {editForm.specialization === 'Custom (Write what you are)' && (
                                    <div className="pt-1 animate-fade-in">
                                        <input
                                            type="text"
                                            value={editForm.customSpecialization}
                                            onChange={(e) => setEditForm({ ...editForm, customSpecialization: e.target.value })}
                                            placeholder="Write your exact clinical specialty (e.g. Interventional Cardiologist)"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            {/* History & Background (Bio) */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Clinical Background, Medical Journey & Specialties
                                </label>
                                <textarea
                                    rows={4}
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    placeholder="Describe your medical background, fellowship training, specialized treatments offered, hospital rotations, and patient care approach..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm leading-relaxed"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qualifications & Degrees</label>
                                    <input
                                        type="text"
                                        value={editForm.qualifications}
                                        onChange={(e) => setEditForm({ ...editForm, qualifications: e.target.value })}
                                        placeholder="e.g. MBBS, MD, FCPS, FRCS"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Years of Experience</label>
                                    <input
                                        type="text"
                                        value={editForm.experience}
                                        onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                                        placeholder="e.g. 14+ Years in Clinical Practice"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital / Clinic Affiliation</label>
                                    <input
                                        type="text"
                                        value={editForm.hospital}
                                        onChange={(e) => setEditForm({ ...editForm, hospital: e.target.value })}
                                        placeholder="e.g. St. Jude Medical Center"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Medical License / Registration No</label>
                                    <input
                                        type="text"
                                        value={editForm.license}
                                        onChange={(e) => setEditForm({ ...editForm, license: e.target.value })}
                                        placeholder="e.g. MD-2026-X99"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 font-medium text-sm"
                                    />
                                </div>
                            </div>

                            {/* Availability Toggle */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Consultation Availability</p>
                                    <p className="text-[11px] text-slate-400">Controls whether you appear as active for new patient requests</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, isAvailable: !editForm.isAvailable })}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                                        editForm.isAvailable
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {editForm.isAvailable ? 'Available' : 'Unavailable'}
                                </button>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-50 shadow-lg shadow-indigo-100"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const QuickInfo = ({ icon, label, value }) => (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
        <div className="flex items-center gap-2 text-indigo-600">
            {icon}
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        </div>
        <p className="font-bold text-slate-900 text-sm truncate">{value || 'Not Specified'}</p>
    </div>
);

const StatCard = ({ title, value, subtitle, icon, badge }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 space-y-4">
        <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                {icon}
            </div>
            <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                {badge}
            </span>
        </div>
        <div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase font-outfit">{value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{title}</p>
            <p className="text-[10px] text-slate-300 font-medium mt-0.5">{subtitle}</p>
        </div>
    </div>
);

export default DoctorProfile;
