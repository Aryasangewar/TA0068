import React, { useState, useEffect } from 'react';
import { getPatientConsentRequests, approveConsent, getCases } from '../services/data';
import { Shield, History, Check, X, User, FileText, Clock } from 'lucide-react';

const PatientDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqs, history] = await Promise.all([
        getPatientConsentRequests(),
        getCases()
      ]);
      setRequests(reqs);
      setCases(history);
    } catch (err) {
      console.error('Failed to fetch patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveConsent(id);
      alert('Consent approved! The doctor now has access for 1 hour.');
      fetchData();
    } catch (err) {
      alert('Failed to approve consent');
    }
  };

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Patient Dashboard</h1>
          <p className="text-slate-500 text-lg">Manage your health data and privacy</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Your Patient ID</p>
          <p className="text-sm font-mono text-primary-600 font-bold">{userInfo._id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Consent Requests */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-blue-50/50">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">Access Requests</h2>
            </div>
            
            <div className="p-6">
              {requests.filter(r => r.status === 'Pending').length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No pending access requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.filter(r => r.status === 'Pending').map((req) => (
                    <div key={req._id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{req.doctorId?.name}</p>
                          <p className="text-xs text-slate-500">{req.doctorId?.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-red-500 transition">
                          <X className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleApprove(req._id)}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-700 transition"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
            <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              Security Information
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              When you click "Approve", the doctor is granted a temporary access token valid for exactly <span className="font-bold underline">1 hour</span>. After 1 hour, the access expires automatically and you must re-approve for further consultation.
            </p>
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <History className="w-5 h-5 text-slate-600" />
            <h2 className="font-bold text-slate-900">Your Medical History</h2>
          </div>
          
          <div className="divide-y divide-slate-100">
            {loading ? (
              <p className="p-8 text-center text-slate-400">Loading history...</p>
            ) : cases.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <FileText className="w-12 h-12 text-slate-200 mx-auto" />
                <p className="text-slate-400">No medical cases documented yet.</p>
              </div>
            ) : (
              cases.map((c) => (
                <div key={c._id} className="p-6 hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-slate-900">Dr. {c.doctorId?.name}</p>
                    <span className="text-xs text-slate-400 font-medium">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider mb-1">Diagnosis</p>
                      <p className="text-sm text-slate-800">{c.structuredData?.diagnosis}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Prescribed Medicines</p>
                      <div className="grid grid-cols-1 gap-2">
                        {c.structuredData?.medicines.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-800">{m.name}</p>
                            <p className="text-[10px] text-emerald-600">{m.dosage} • {m.frequency}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
