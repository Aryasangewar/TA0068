import React, { useState, useEffect } from 'react';
import { getPatientConsentRequests, approveConsent, getCases } from '../services/data';
import { 
  Shield, 
  History, 
  Check, 
  User, 
  FileText, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Clipboard, 
  Pill, 
  MessageSquare, 
  Image as ImageIcon, 
  ChevronDown, 
  ChevronUp, 
  Activity,
  ArrowRight,
  Fingerprint,
  Lock,
  Trash2,
  X,
  Loader2
} from 'lucide-react';

const PatientDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCase, setExpandedCase] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  
  const [selectedFields, setSelectedFields] = useState({
    diagnosis: true,
    medicines: true,
    advice: true,
    prescriptionImage: true,
    resolutionNotes: true
  });

  const availableFields = [
    { id: 'diagnosis', label: 'Clinical Diagnosis', icon: Clipboard, desc: 'Primary health findings' },
    { id: 'medicines', label: 'Medication Details', icon: Pill, desc: 'Dosage and frequency' },
    { id: 'advice', label: 'Lifestyle Advice', icon: MessageSquare, desc: 'Doctor recommendations' },
    { id: 'prescriptionImage', label: 'Clinical Scans', icon: ImageIcon, desc: 'Images and physical RX' },
    { id: 'resolutionNotes', label: 'Outcome Summary', icon: FileText, desc: 'Treatment resolution' },
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
      console.error('Failed to sync history');
    } finally {
      setLoading(false);
    }
  };

  const openApproveModal = (req) => {
    setActiveRequest(req);
    setShowConsentModal(true);
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      const allowedFields = Object.keys(selectedFields).filter(k => selectedFields[k]);
      await approveConsent(activeRequest._id, allowedFields);
      setShowConsentModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to authorize access.');
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (field) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 space-y-16 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 animate-fade-in text-center md:text-left">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-100 rounded-full text-teal-600 text-xs font-black uppercase tracking-widest">
                <Fingerprint className="w-3 h-3" /> Secure Health ID Verified
             </div>
             <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter italic uppercase font-outfit">Clinical Vault</h1>
             <p className="text-slate-500 text-xl font-medium">Synced as {userInfo.name} • <span className="text-indigo-600 font-bold">#{userInfo._id.slice(-6)}</span></p>
          </div>
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/40">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Authorized Peers</p>
                <p className="text-sm font-bold text-slate-900">2 Active Connections</p>
             </div>
             <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Shield className="w-6 h-6 border border-indigo-100 rounded-lg p-1" />
             </div>
          </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
        {/* Alerts & Consent (Left 1/4) */}
        <div className="xl:col-span-1 space-y-8 animate-fade-in delay-200">
           <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
             <Lock className="w-3 h-3 text-indigo-400" /> Privacy Control
           </h2>
           
           {requests.filter(r => r.status === 'Pending').length > 0 ? (
             <div className="space-y-4">
               {requests.filter(r => r.status === 'Pending').map((req) => (
                  <div key={req._id} className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-100/50 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                     <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-6 relative z-10">Incoming Access Request</p>
                     <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-xl italic uppercase border border-white/20">
                           {req.doctorId?.name.charAt(0)}
                        </div>
                        <div>
                           <p className="text-xl font-black italic uppercase tracking-tighter">Dr. {req.doctorId?.name}</p>
                           <p className="text-xs text-indigo-100 font-bold opacity-70">Clinical Center 04</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => openApproveModal(req)}
                       className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition transform hover:-translate-y-1 relative z-10"
                     >
                       Authorize Sync
                     </button>
                  </div>
                ))}
             </div>
           ) : (
             <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                   <Shield className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-bold text-sm tracking-tight">No pending clinical access requests.</p>
             </div>
           )}

           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
              <Activity className="absolute -right-8 -bottom-8 w-40 h-40 text-indigo-500/10 opacity-50 group-hover:rotate-12 transition-transform duration-700" />
              <div className="relative z-10 space-y-4">
                 <h3 className="text-lg font-black uppercase tracking-tighter italic">Secured Records</h3>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed">DocuFlux nutzt E2EE on a case-by-case basis. History is fragmented until you authorize decoding.</p>
              </div>
           </div>
        </div>

        {/* History Feed (Right 3/4) */}
        <div className="xl:col-span-3 space-y-8 animate-fade-in delay-400">
           <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
             <History className="w-3 h-3 text-teal-400" /> Documentation Feed
           </h2>

           <div className="space-y-6">
              {loading ? (
                <div className="py-20 text-center space-y-4 animate-pulse">
                   <Loader2 className="w-10 h-10 text-indigo-200 mx-auto animate-spin" />
                   <p className="text-slate-300 font-bold">Synchronizing Encrypted Vault...</p>
                </div>
              ) : cases.length === 0 ? (
                <div className="bg-white rounded-[3rem] border border-slate-100 py-32 text-center">
                   <Clipboard className="w-20 h-20 text-slate-50 mx-auto mb-8" />
                   <h3 className="text-3xl font-black text-slate-200 uppercase italic">Empty Legacy</h3>
                </div>
              ) : (
                cases.map((c) => (
                  <CaseCard 
                    key={c._id} 
                    c={c} 
                    isExpanded={expandedCase === c._id} 
                    onToggle={() => setExpandedCase(expandedCase === c._id ? null : c._id)} 
                  />
                ))
              )}
           </div>
        </div>
      </div>

      {/* Consent Redesign (Modal) */}
      {showConsentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-fade-in">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden transform animate-slide-up" style={{ animationDuration: '0.4s' }}>
              <div className="p-10 lg:p-12 space-y-10">
                 <div className="flex items-center justify-between">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner">
                       <Shield className="w-8 h-8" />
                    </div>
                    <button onClick={() => setShowConsentModal(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-rose-500 transition border border-slate-100">
                       <X className="w-6 h-6" />
                    </button>
                 </div>
                 
                 <div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Authorize Port</h3>
                    <p className="text-slate-500 font-medium mt-1">Dr. {activeRequest?.doctorId?.name} is attempting clinical handshake.</p>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Select Visible Data Nodes:</p>
                    <div className="grid grid-cols-1 gap-3">
                       {availableFields.map((field) => (
                         <button 
                           key={field.id}
                           onClick={() => toggleField(field.id)}
                           className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                             selectedFields[field.id] 
                             ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' 
                             : 'bg-white border-slate-100 opacity-60'
                           }`}
                         >
                            <div className="flex items-center gap-5 text-left">
                               <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedFields[field.id] ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                                  <field.icon className="w-6 h-6" />
                                </div>
                                <div>
                                   <p className={`text-md font-bold uppercase tracking-tight ${selectedFields[field.id] ? 'text-indigo-900' : 'text-slate-400'}`}>{field.label}</p>
                                   <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">{field.desc}</p>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full relative transition-all ${selectedFields[field.id] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedFields[field.id] ? 'right-1' : 'left-1'}`} />
                            </div>
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-8 grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setShowConsentModal(false)}
                      className="py-5 border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl hover:bg-slate-50 transition"
                    >
                      Deny Access
                    </button>
                    <button 
                      onClick={handleApprove}
                      className="py-5 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition transform hover:-translate-y-1"
                    >
                      Authorize Channel
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
      <footer className="mt-20 pt-10 border-t border-slate-200 text-center pb-10">
         <p className="text-[10px] font-black text-indigo-500/30 uppercase tracking-[0.2em] italic">Design and Developed by Mohsin</p>
      </footer>
    </div>
  );
};

const CaseCard = ({ c, isExpanded, onToggle }) => (
  <div className={`bg-white rounded-[3rem] border transition-all duration-700 overflow-hidden ${isExpanded ? 'border-indigo-100 ring-[24px] ring-indigo-50/20 shadow-2xl' : 'border-slate-100 hover:border-slate-200 hover:shadow-2xl hover:shadow-slate-100'}`}>
    <div className="p-8 lg:p-12">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
             <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-indigo-600 border border-slate-100 shadow-inner group">
                <Activity className="w-10 h-10 group-hover:scale-110 transition duration-500" />
             </div>
             <div>
                <p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase font-outfit">Dr. {c.doctorId?.name}</p>
                <div className="flex items-center gap-4 mt-2">
                   <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 px-3 py-1 rounded-full">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(c.createdAt).toLocaleDateString()}
                   </div>
                   <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${c.status === 'Completed' ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                      {c.status}
                   </div>
                </div>
             </div>
          </div>
          <button 
            onClick={onToggle}
            className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-indigo-600 transition-colors shadow-2xl shadow-indigo-100 ml-auto md:ml-0"
          >
            {isExpanded ? 'Close Vault' : 'Access Data Node'}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
       </div>

       {c.structuredData ? (
         <div className={`mt-12 space-y-16 transition-all duration-700 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
               <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-2">Medical Core Observation</p>
                  <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5"><Activity className="w-24 h-24" /></div>
                     <p className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">{c.structuredData.diagnosis}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-4">
                     {c.structuredData.symptoms?.map((s, i) => (
                       <span key={i} className="px-5 py-2.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition cursor-default">{s}</span>
                     ))}
                  </div>
               </div>

               <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-2">Prescription Protocol</p>
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100/50">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                           <tr>
                              <th className="px-8 py-5">Active Agent</th>
                              <th className="px-8 py-5">Frequency Matrix</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-sm">
                           {c.structuredData.medicines?.map((m, i) => (
                             <tr key={i} className="hover:bg-slate-50/50 transition duration-300">
                                <td className="px-8 py-5 text-slate-900 font-black italic tracking-tight">{m.name}</td>
                                <td className="px-8 py-5 text-indigo-600 font-bold uppercase tracking-tighter text-xs">{m.dosage} • {m.frequency}</td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 pt-16 border-t border-slate-50">
               <div className="lg:col-span-2 space-y-6">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-2">Physician's Advisory</p>
                  <div className="p-10 bg-indigo-50/30 rounded-[3rem] text-slate-700 italic font-medium leading-relaxed border border-indigo-100/50 relative">
                    <span className="absolute top-6 left-6 text-6xl text-indigo-100 font-serif leading-none italic opacity-50">"</span>
                    <p className="relative z-10 pl-6 text-lg">{c.structuredData.advice}</p>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-2 mb-6">Secured Artifacts</p>
                  {c.prescriptionImage ? (
                    <div className="rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden group relative">
                       <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors pointer-events-none" />
                       <img src={c.prescriptionImage} alt="RX" className="w-full h-auto group-hover:scale-105 transition duration-1000" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-300 grayscale opacity-50">
                       <ImageIcon className="w-12 h-12" />
                       <span className="text-[10px] font-black uppercase tracking-widest">No Media Nodes</span>
                    </div>
                  )}
               </div>
            </div>

            {c.resolutionNotes && (
              <div className="bg-slate-900 p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.1),transparent)]" />
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0 border border-white/10 relative z-10 shadow-2xl">
                    <Activity className="w-8 h-8 group-hover:scale-110 transition duration-700" />
                 </div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Clinical Completion Resolution</p>
                    <p className="text-white font-black text-2xl italic tracking-tighter leading-tight">{c.resolutionNotes}</p>
                 </div>
              </div>
            )}
         </div>
       ) : (
         <div className="mt-8 p-10 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex items-center justify-center gap-4 animate-pulse">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-indigo-900 font-black uppercase tracking-tighter italic text-xs">Clinical Node Synchronizing...</p>
         </div>
       )}
    </div>
  </div>
);

export default PatientDashboard;
