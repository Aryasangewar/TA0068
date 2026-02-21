import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, Mail, Lock, User, UserCheck, Loader2, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Doctor');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/auth/signup', { name, email, password, role });
            localStorage.setItem('userInfo', JSON.stringify(response.data));
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-slate-50 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[10%] left-[10%] w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />

            <div className="w-full max-w-lg bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden animate-fade-in relative z-10">
                <div className="p-8 md:p-12">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-primary rounded-[1.25rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-100 mb-6">
                            <Activity className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Health ID</h1>
                        <p className="text-slate-500 mt-2 font-medium">Join the next-gen clinical documentation network</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-6">
                        {/* Role Toggle */}
                        <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
                            <button
                                type="button"
                                onClick={() => setRole('Doctor')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${role === 'Doctor' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Activity className="w-4 h-4" />
                                I am a Doctor
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('Patient')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${role === 'Patient' ? 'bg-white text-secondary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <HeartPulse className="w-4 h-4" />
                                I am a Patient
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Full Name" icon={<User className="w-5 h-5" />} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. John Doe" />
                            <InputField label="Email Address" icon={<Mail className="w-5 h-5" />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@hospital.com" type="email" />
                        </div>

                        <InputField label="Secure Password" icon={<Lock className="w-5 h-5" />} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" />

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <p className="text-xs font-bold text-red-600">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-primary-dark transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <span>Initialize Identity</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-10 text-slate-500 font-medium text-sm">
                        Already have a Health ID? <Link to="/login" className="text-primary font-bold hover:underline">Sync Access</Link>
                    </p>
                </div>

                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distributed Ledger Verified Registration</span>
                </div>
            </div>
            <p className="absolute bottom-8 text-[10px] font-black text-indigo-500/30 uppercase tracking-[0.2em] italic">Design and Developed by Mohsin,Wasif,Furqan,Arya,Tamanna</p>
        </div>
    );
};

const InputField = ({ label, icon, value, onChange, placeholder, type = "text" }) => (
    <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition">
                {icon}
            </div>
            <input
                type={type}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition text-slate-900 font-medium"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required
            />
        </div>
    </div>
);

export default Signup;
