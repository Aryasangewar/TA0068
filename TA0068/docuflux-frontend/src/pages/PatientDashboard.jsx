import React, { useState, useEffect } from 'react';
import { getPatientConsentRequests, approveConsent, getCases } from '../services/data';
import { Shield, History, Check, X, User, FileText, Clock, AlertCircle, Calendar, Clipboard, Pill, MessageSquare, Image as ImageIcon, ChevronDown, ChevronUp, Activity } from 'lucide-react';

const PatientDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCase, setExpandedCase] = useState(null);
  
  // Consent Field Visibility state
  const [selectedFields, setSelectedFields] = useState({
    diagnosis: true,
    medicines: true,
    advice: true,
    prescriptionImage: true,
    resolutionNotes: true
  });

  const availableFields = [
    { id: 'diagnosis', label: 'Diagnosis', icon: Clipboard },
    { id: 'medicines', label: 'Medicines', icon: Pill },
    { id: 'advice', label: 'Clinical Advice', icon: MessageSquare },
    { id: 'prescriptionImage', label: 'Prescription Images', icon: ImageIcon },
    { id: 'resolutionNotes', label: 'Resolution Summary', icon: FileText },
  ];

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
      const allowedFields = Object.keys(selectedFields).filter(k => selectedFields[k]);
      await approveConsent(id, allowedFields);
      alert('Consent approved! The doctor now has limited access for 1 hour.');
      fetchData();
    } catch (err) {
      alert('Failed to approve consent');
    }
  };

  const toggleField = (field) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Health Dashboard</h1>
          <p className="text-slate-500 text-lg mt-1">Hello, {userInfo.name} 👋</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Health ID (ABHA Simulation)</p>
          <p className="text-md font-mono text-primary-600 font-bold">{userInfo._id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Consent & Security (1/3) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-blue-600">
              <Shield className="w-6 h-6 text-white" />
              <h2 className="font-bold text-white text-lg">Inbound Access Requests</h2>
            </div>
            
            <div className="p-6">
              {requests.filter(r => r.status === 'Pending').length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-medium">No active requests.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {requests.filter(r => r.status === 'Pending').map((req) => (
                    <div key={req._id} className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                          <User className="w-6 h-6 text-primary-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">{req.doctorId?.name}</p>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Doctor requesting access</p>
                        </div>
                      </div>

                      {/* Visibility Controls */}
                      <div className="py-2 space-y-3">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select what to share:</p>
                         <div className="grid grid-cols-1 gap-2">
                           {availableFields.map((field) => (
                             <button
                               key={field.id}
                               onClick={() => toggleField(field.id)}
                               className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                 selectedFields[field.id] 
                                 ? 'bg-white border-primary-200 shadow-sm text-slate-900' 
                                 : 'bg-transparent border-slate-100 text-slate-400'
                               }`}
                             >
                               <div className={`p-1.5 rounded-lg ${selectedFields[field.id] ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-400'}`}>
                                 <field.icon className="w-4 h-4" />
                               </div>
                               <span className="text-sm font-semibold">{field.label}</span>
                               {selectedFields[field.id] && <Check className="w-4 h-4 ml-auto text-primary-500" />}
                             </button>
                           ))}
                         </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition">
                          Deny
                        </button>
                        <button 
                          onClick={() => handleApprove(req._id)}
                          className="flex-[2] bg-primary-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition flex items-center justify-center gap-2"
                        >
                          <Check className="w-5 h-5" />
                          Approve Port
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
            <Shield className="absolute -right-8 -bottom-8 w-40 h-40 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Clock className="w-6 h-6 text-indigo-300" />
                Zero-Trust Access
              </h3>
              <p className="text-indigo-100 leading-relaxed opacity-90">
                DocuFlux simulation uses dynamic field encryption. Doctors can only decode the data points you explicitly approved above. Access tokens self-destruct in <span className="text-amber-300 font-bold underline">60 minutes</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Medical History (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden min-h-[600px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <History className="w-7 h-7 text-primary-600" />
                Clinical Document Repository
              </h2>
              <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold">
                {cases.length} RECORDS FOUND
              </span>
            </div>
            
            <div className="p-6 lg:p-10 divide-y divide-slate-100">
              {loading ? (
                <div className="py-20 text-center animate-pulse">
                   <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4"></div>
                   <p className="text-slate-400 font-bold">Retrieving records from blockchain node...</p>
                </div>
              ) : cases.length === 0 ? (
                <div className="py-32 text-center">
                  <FileText className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-slate-400">Your health vault is empty</h3>
                  <p className="text-slate-300 max-w-xs mx-auto mt-2">Documented consultations will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {cases.map((c) => (
                    <div 
                      key={c._id} 
                      className={`rounded-3xl border transition-all duration-300 p-6 lg:p-8 ${expandedCase === c._id ? 'border-primary-200 ring-4 ring-primary-50 shadow-xl' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 border border-primary-100">
                            <Activity className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-xl font-extrabold text-slate-900">Dr. {c.doctorId?.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                               <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                                 <Calendar className="w-3.5 h-3.5" />
                                 {new Date(c.createdAt).toLocaleDateString()}
                               </div>
                               <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                               <span className={`px-2.5 py-0.5 rounded-inner text-[10px] font-black uppercase tracking-tighter ${c.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                 {c.status}
                               </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedCase(expandedCase === c._id ? null : c._id)}
                          className="text-slate-900 bg-slate-50 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition ml-auto md:ml-0"
                        >
                          {expandedCase === c._id ? 'Compact View' : 'View Full Report'}
                          {expandedCase === c._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Structured Content Area */}
                      {!c.structuredData ? (
                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-center gap-4">
                           <AlertCircle className="w-6 h-6 text-amber-500" />
                           <p className="text-amber-800 font-bold">No structured report available for this record.</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Left Content */}
                              <div className="space-y-6">
                                <div className="space-y-2">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Primary Diagnosis</p>
                                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                                    <p className="text-slate-900 font-bold text-lg">{c.structuredData.diagnosis}</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Symptoms Identified</p>
                                  <div className="flex flex-wrap gap-2">
                                    {c.structuredData.symptoms?.map((s, idx) => (
                                      <span key={idx} className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {c.resolutionNotes && (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest pl-1">Clinical Resolution</p>
                                    <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50">
                                      <p className="text-blue-900 italic text-sm leading-relaxed">"{c.resolutionNotes}"</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right Content: Medicines */}
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Prescription List</p>
                                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                                  <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                      <tr>
                                        <th className="px-5 py-4">Drug Name</th>
                                        <th className="px-5 py-4">Dose / Freq</th>
                                        <th className="px-5 py-4">Duration</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {c.structuredData.medicines?.map((m, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                                          <td className="px-5 py-4 font-extrabold text-slate-900">{m.name}</td>
                                          <td className="px-5 py-4">
                                            <p className="text-slate-600 font-medium">{m.dosage}</p>
                                            <p className="text-[10px] font-bold text-primary-500 uppercase">{m.frequency}</p>
                                          </td>
                                          <td className="px-5 py-4 text-slate-500 font-medium">{m.duration}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                           </div>

                           {/* Full Report View */}
                           {expandedCase === c._id && (
                             <div className="pt-8 mt-8 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                                <div className="lg:col-span-2 space-y-4">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Doctor's Clinical Advice</p>
                                   <div className="bg-white p-6 rounded-3xl border border-slate-200 leading-relaxed text-slate-700">
                                      {c.structuredData.advice}
                                   </div>
                                </div>
                                {c.prescriptionImage && (
                                  <div className="space-y-4">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Attached Prescription Scan</p>
                                     <div className="rounded-3xl border-4 border-white shadow-xl overflow-hidden cursor-zoom-in group">
                                        <img src={c.prescriptionImage} alt="Clinical Scan" className="w-full h-auto group-hover:scale-105 transition duration-500" />
                                     </div>
                                  </div>
                                )}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
