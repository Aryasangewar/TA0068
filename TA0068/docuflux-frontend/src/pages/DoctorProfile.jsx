import React, { useState, useEffect } from 'react';
import { getCases } from '../services/data';
import { User, Mail, Award, Clock, CheckCircle, BarChart3, ShieldCheck, Activity, Fingerprint, Calendar, Building, CreditCard } from 'lucide-react';

const DoctorProfile = () => {
  const [stats, setStats] = useState({ totalCases: 0, completedCases: 0 });
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getCases();
        setStats({
          totalCases: data.length,
          completedCases: data.filter(c => c.status === 'Completed').length
        });
      } catch (err) {
        console.error('Error fetching stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 px-4">
      {/* Premium Profile Header */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
        <div className="h-48 bg-primary relative overflow-hidden">
           <Activity className="absolute -right-10 -top-10 w-64 h-64 text-white/10" />
           <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="px-10 pb-12">
          <div className="relative -mt-20 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="w-40 h-40 bg-white rounded-[2.5rem] shadow-2xl border-8 border-white flex items-center justify-center text-primary group overflow-hidden">
                <div className="w-full h-full bg-slate-50 flex items-center justify-center group-hover:scale-110 transition duration-500">
                    <User className="w-20 h-20 text-slate-200" />
                </div>
              </div>
              <div className="pb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-emerald-100">
                  <ShieldCheck className="w-3 h-3" /> Verified Practitioner
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Dr. {user.name}</h1>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em] mt-1 italic">Internal Medicine & Diagnostics</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Medical ID</p>
                  <p className="text-sm font-mono font-bold text-slate-900">DFX-{user._id.substring(0, 8).toUpperCase()}</p>
               </div>
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                  <Fingerprint className="w-6 h-6" />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <QuickInfo icon={<Mail className="w-4 h-4" />} label="Network Portal" value={user.email} />
             <QuickInfo icon={<Building className="w-4 h-4" />} label="Affiliation" value="DocuFlux Health" />
             <QuickInfo icon={<Calendar className="w-4 h-4" />} label="Joined" value="Feb 2026" />
             <QuickInfo icon={<CreditCard className="w-4 h-4" />} label="License No" value="MD-2026-X99" />
          </div>
        </div>
      </div>

      {/* Stats and Analytics */}
      <section className="animate-fade-in delay-1">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
               <BarChart3 className="w-3 h-3" /> Clinical Performance
            </h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnalyticCard 
              label="Data Synced (JSON)" 
              value={stats.totalCases} 
              icon={<Activity className="w-6 h-6 text-blue-600" />} 
              trend="+14.2% Growth"
            />
            <AnalyticCard 
              label="Archives Finalized" 
              value={stats.completedCases} 
              icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} 
              trend="100% Accuracy"
            />
            <AnalyticCard 
              label="Trust Score" 
              value="9.8" 
              icon={<Award className="w-6 h-6 text-indigo-600" />} 
              trend="Top 1% Rank"
            />
         </div>
      </section>

      {/* Professional Credentials Section */}
      <section className="bg-slate-900 rounded-[3rem] p-12 text-white overflow-hidden relative group animate-fade-in delay-2">
         <ShieldCheck className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 opacity-50 group-hover:rotate-12 transition-transform duration-1000" />
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
               <h3 className="text-2xl font-black italic uppercase tracking-tighter">Verified Credentials</h3>
               <div className="space-y-6">
                  <CredentialItem label="Primary Specialization" value="Advanced Internal Medicine" />
                  <CredentialItem label="Secondary Specialization" value="Medical Informatics" />
                  <CredentialItem label="Education" value="DocuFlux University of Technology & Health" />
               </div>
            </div>
            <div className="space-y-8">
               <h3 className="text-2xl font-black italic uppercase tracking-tighter">Security & Access</h3>
               <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scribe System Status</span>
                     <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/30 uppercase tracking-widest">PRO_MEMBER_ACTIVE</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vault Encryption</span>
                     <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-full border border-blue-500/30 uppercase tracking-widest">AES-256-DFX</span>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <footer className="mt-20 pt-10 border-t border-slate-200 text-center pb-10">
         <p className="text-[10px] font-black text-indigo-500/30 uppercase tracking-[0.2em] italic">Design and Developed by Mohsin</p>
      </footer>
    </div>
  );
};

const QuickInfo = ({ icon, label, value }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <div className="flex items-center gap-2 mb-1">
       <span className="text-slate-300">{icon}</span>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-sm font-bold text-slate-700 truncate">{value}</p>
  </div>
);

const AnalyticCard = ({ label, value, icon, trend }) => (
  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
        {icon}
     </div>
     <div>
        <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-1">{label}</h4>
        <p className="text-4xl font-extrabold text-slate-900 tracking-tighter italic">{value}</p>
     </div>
     <div className="text-[10px] font-bold text-slate-400 italic uppercase">
        {trend}
     </div>
  </div>
);

const CredentialItem = ({ label, value }) => (
  <div className="space-y-1">
     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
     <p className="text-lg font-bold text-white tracking-tight">{value}</p>
  </div>
);

export default DoctorProfile;
