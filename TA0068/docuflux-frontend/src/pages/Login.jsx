import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, Mail, Lock, LogIn, ArrowRight, Loader2, ShieldCheck, Stethoscope, ChevronDown, Check } from 'lucide-react';

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

const Login = ({ onAuth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isDoctor, setIsDoctor] = useState(false);
    const [specialization, setSpecialization] = useState('Cardiologist');
    const [customSpecialization, setCustomSpecialization] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const finalSpecialization = isDoctor
                ? (specialization === 'Custom (Write what you are)' ? customSpecialization.trim() : specialization)
                : '';

            const response = await axios.post('/api/auth/login', {
                email,
                password,
                specialization: finalSpecialization || undefined
            });

            // Store in sessionStorage — each tab is an independent session
            sessionStorage.setItem('userInfo', JSON.stringify(response.data));
            // Notify App component
            window.dispatchEvent(new Event('auth-change'));
            if (onAuth) onAuth();
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-slate-50 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[10%] right-[10%] w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />

            <div className="w-full max-w-md bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden animate-fade-in relative z-10">
                <div className="p-8 md:p-12">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-primary rounded-[1.25rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-100 mb-6">
                            <Activity className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 mt-2 font-medium">Access your secure clinical workspace</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition text-slate-900 font-medium"
                                    placeholder="name@hospital.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Security Key</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition text-slate-900 font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Doctor Quick Specialization Option */}
                        <div className="p-4 bg-indigo-50/50 border border-indigo-100/70 rounded-2xl space-y-3">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isDoctor}
                                    onChange={(e) => setIsDoctor(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                                    <Stethoscope className="w-4 h-4 text-indigo-600" />
                                    <span>Doctor Login: Set / Update What You Are</span>
                                </div>
                            </label>

                            {isDoctor && (
                                <div className="space-y-3 pt-1 animate-fade-in">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest pl-1">
                                            Your Clinical Specialty
                                        </label>
                                        <select
                                            value={specialization}
                                            onChange={(e) => setSpecialization(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-white border border-indigo-100 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none"
                                        >
                                            {COMMON_SPECIALTIES.map((spec) => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {specialization === 'Custom (Write what you are)' && (
                                        <div className="space-y-1.5 animate-fade-in">
                                            <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest pl-1">
                                                Type Exact Specialty / What You Are
                                            </label>
                                            <input
                                                type="text"
                                                value={customSpecialization}
                                                onChange={(e) => setCustomSpecialization(e.target.value)}
                                                placeholder="e.g. Interventional Cardiologist, Neurosurgeon..."
                                                className="w-full px-3.5 py-2.5 bg-white border border-indigo-100 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none"
                                                required={isDoctor && specialization === 'Custom (Write what you are)'}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-fade-in">
                                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                <p className="text-xs font-bold text-red-600">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-primary-dark transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <span>Unlock Access</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-10 text-slate-500 font-medium text-sm">
                        Need a verified identity? <Link to="/signup" className="text-primary font-bold hover:underline">Join Network</Link>
                    </p>
                </div>

                {/* Footer status */}
                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Encrypted Session</span>
                </div>
            </div>
            <p className="absolute bottom-8 text-[10px] font-black text-indigo-500/30 uppercase tracking-[0.2em] italic">Design and Developed by Mohsin, Wasif, Furqan, Arya, Tamanna</p>
        </div>
    );
};

export default Login;
