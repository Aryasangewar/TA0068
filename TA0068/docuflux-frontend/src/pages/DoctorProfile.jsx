import React, { useState, useEffect } from 'react';
import { getCases } from '../services/data';
import { User, Mail, Award, Clock, CheckCircle, BarChart3, ShieldCheck } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-indigo-600"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6">
            <div className="w-32 h-32 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center text-primary-600">
              <User className="w-16 h-16" />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
              <p className="text-primary-600 font-semibold text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Verified Medical Professional
              </p>
              <p className="text-slate-500 mt-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="px-6 py-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</p>
                <p className="text-sm font-mono font-bold text-slate-700">{user._id.substring(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Consultations</p>
          <p className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.totalCases}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Care Cycles Completed</p>
          <p className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.completedCases}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Active Monitoring</p>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
            <Award className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm font-medium">AI Precision Score</p>
          <p className="text-2xl font-bold text-slate-900">98%</p>
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Professional Credentials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Specialization</p>
              <p className="text-slate-800 font-medium">General Practitioner</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Medical License</p>
              <p className="text-slate-800 font-medium tracking-wide">MD-DFX-2026-99001</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hospital Affiliation</p>
              <p className="text-slate-800 font-medium">DocuFlux Digital Health Network</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Account Role</p>
              <span className="px-3 py-1 bg-primary-100 text-primary-600 text-xs font-bold rounded-full">
                DOCTOR_SCRIBE_PLUS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
