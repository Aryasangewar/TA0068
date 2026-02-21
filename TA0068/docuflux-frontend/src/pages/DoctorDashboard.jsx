import React, { useState, useEffect } from 'react';
import { getCases, requestConsent } from '../services/data';
import ScribeFlow from '../components/ScribeFlow';
import { Search, History, Activity, Calendar, User, ArrowRight } from 'lucide-react';

const DoctorDashboard = () => {
  const [cases, setCases] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [showScribe, setShowScribe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ consultations: 0, completions: 0 });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const data = await getCases();
      setCases(data);
      setStats({
        consultations: data.length,
        completions: data.filter(c => c.status === 'Completed').length
      });
    } catch (err) {
      console.error('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestConsent = async () => {
    if (!patientId) return alert('Please enter a Patient ID');
    try {
      await requestConsent(patientId);
      alert('Consent request sent to patient. Once they approve, you can start the consultation.');
      setShowScribe(true); // Show scribe to allow them to wait/proceed if already approved
    } catch (err) {
      alert('Error requesting consent. Make sure the Patient ID is valid.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Doctor Dashboard</h1>
          <p className="text-slate-500 text-lg">Manage your consultations and medical records</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[180px]">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">CONSULTATIONS</p>
              <p className="text-xl font-bold text-slate-900">{stats.consultations}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[180px]">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">COMPLETED</p>
              <p className="text-xl font-bold text-slate-900">{stats.completions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Scribe & Search */}
        <div className="lg:col-span-2 space-y-6">
          {!showScribe ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mb-4 rotate-3">
                <Search className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Start New Consultation</h2>
              <p className="text-slate-500 max-w-sm mx-auto">Enter a Patient ID to request consent and start the AI-powered scribe assistant.</p>
              
              <div className="max-w-md mx-auto flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 transition"
                  placeholder="Enter Patient ID (e.g. 65ed...)"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                />
                <button 
                  onClick={handleRequestConsent}
                  className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition flex items-center gap-2"
                >
                  Proceed <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-4 italic">Note: Future integration with ABHA (Ayushman Bharat Digital Mission) will be added here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={() => setShowScribe(false)}
                className="text-sm font-medium text-slate-500 hover:text-primary-600 flex items-center gap-1 transition"
              >
                ← Back to Search
              </button>
              <ScribeFlow patientId={patientId} onComplete={() => {
                setShowScribe(false);
                fetchCases();
              }} />
            </div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-primary-500" />
                Recent Cases
              </h3>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {loading ? (
                <p className="p-8 text-center text-slate-400">Loading cases...</p>
              ) : cases.length === 0 ? (
                <p className="p-8 text-center text-slate-400">No cases documented yet.</p>
              ) : (
                cases.map((c) => (
                  <div key={c._id} className="p-5 hover:bg-slate-50 transition group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{c.patientId?.name || 'Unknown Patient'}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`ml-auto px-2 py-1 rounded-full text-[10px] font-bold ${
                        c.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{c.structuredData?.diagnosis || 'No diagnosis recorded'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
