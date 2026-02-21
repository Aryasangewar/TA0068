import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, CheckCircle, Plus, Trash2, Upload, X, FileText, Image as ImageIcon, Loader2, Play, Volume2, ShieldCheck, Activity, ArrowRight, Zap } from 'lucide-react';
import { processTranscript, saveCase, requestConsent } from '../services/data';

const ScribeFlow = ({ onComplete }) => {
  const [patientId, setPatientId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [structuredData, setStructuredData] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [prescriptionImage, setPrescriptionImage] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState('identify'); // 'identify', 'record', 'preview'
  
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript((prev) => prev + event.results[i][0].transcript + ' ');
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const handleIdentifyPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cleanId = patientId.trim().replace(/^#/, '');
      const response = await requestConsent(cleanId);
      // Store the full ID returned by the server for future operations
      setPatientId(response.patientId);
      setStage('record');
    } catch (err) {
      setError(err.response?.data?.message || 'Patient ID not found or network error.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setStructuredData(null);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessTranscript = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await processTranscript(transcript);
      setStructuredData(data);
      setStage('preview');
    } catch (err) {
      setError('AI processing failed. Check connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await saveCase({
        patientId,
        transcript,
        structuredData,
        resolutionNotes,
        prescriptionImage
      });
      onComplete();
    } catch (err) {
      setError('Failed to save case archive.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Identity Stage */}
      {stage === 'identify' && (
        <div className="bg-white rounded-[3.5rem] p-16 lg:p-24 shadow-2xl shadow-indigo-100 border border-slate-100 flex flex-col items-center text-center animate-fade-in relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <div className="w-28 h-28 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mb-10 shadow-2xl shadow-indigo-200 border-4 border-white relative z-10 transition-transform duration-500 group-hover:scale-110">
              <ShieldCheck className="w-14 h-14" />
           </div>
           <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 italic uppercase font-outfit">Identity Port</h2>
           <p className="text-slate-500 max-w-md mb-14 font-medium leading-relaxed">Initialize a zero-trust clinical documentation tunnel by entering the patient's unique network ID.</p>
           
           <form onSubmit={handleIdentifyPatient} className="w-full max-w-sm space-y-6 relative z-10">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4 block">Secure Identifier</label>
                 <input 
                  type="text" 
                  placeholder="PORT_ID_6582..." 
                  className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-indigo-50 focus:border-indigo-600 text-center font-mono text-xl font-black tracking-widest text-slate-900 transition-all placeholder:text-slate-200"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-slate-300 hover:bg-indigo-600 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Access Clinical Node <ArrowRight className="w-5 h-5" /></>}
              </button>
           </form>
           {error && <p className="mt-8 text-rose-500 font-black text-xs uppercase tracking-widest bg-rose-50 px-6 py-2 rounded-full border border-rose-100"> {error}</p>}
        </div>
      )}

      {/* Recording Stage */}
      {stage === 'record' && (
        <div className="space-y-12 animate-fade-in">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Mic Controller - Industrial Design */}
              <div className="lg:col-span-1 bg-slate-900 rounded-[3rem] p-12 shadow-2xl shadow-indigo-100/50 flex flex-col items-center justify-center text-center text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl opacity-50" />
                 <div className="relative mb-12">
                    {isRecording && (
                      <div className="absolute -inset-10 bg-indigo-500/20 rounded-full animate-ping" />
                    )}
                    <button 
                      onClick={toggleRecording}
                      className={`w-36 h-36 rounded-full flex items-center justify-center transition-all shadow-[0_0_60px_-15px_rgba(0,0,0,0.3)] border-8 border-white/5 ${isRecording ? 'bg-rose-500 shadow-rose-900/40 animate-pulse' : 'bg-indigo-600 shadow-indigo-900/40 hover:scale-105 hover:bg-indigo-500'}`}
                    >
                      {isRecording ? <Square className="w-12 h-12 text-white fill-white" /> : <Mic className="w-12 h-12 text-white" />}
                    </button>
                 </div>
                 <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2 font-outfit">
                   {isRecording ? 'LIVE_STREAM' : 'NODE_READY'}
                 </h3>
                 <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em] opacity-70 mb-12">{isRecording ? 'CAPTURING CLINICAL INTENT' : 'AWAITING VOICE INPUT'}</p>
                 
                 <div className="w-full pt-10 border-t border-white/10 grid grid-cols-2 gap-4 relative z-10">
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex flex-col items-center gap-3 transition-colors"
                    >
                       <Upload className="w-6 h-6 text-indigo-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">UPLOAD_RX</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    <button className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex flex-col items-center gap-3 transition-colors">
                       <Zap className="w-6 h-6 text-indigo-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">AI_BOOST</span>
                    </button>
                 </div>
              </div>

              {/* Transcript Display */}
              <div className="lg:col-span-2 space-y-8">
                 {prescriptionImage && (
                    <div className="bg-indigo-600 rounded-3xl p-6 text-white flex items-center justify-between shadow-2xl shadow-indigo-200 animate-slide-up relative overflow-hidden group">
                       <div className="flex items-center gap-6 relative z-10">
                          <img src={prescriptionImage} alt="Prescription" className="w-20 h-20 object-cover rounded-2xl border-2 border-white/20 shadow-xl" />
                          <div>
                             <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100">Artifact Digitized</p>
                             <p className="font-bold text-lg tracking-tight">Prescription Node Attached</p>
                          </div>
                       </div>
                       <button onClick={() => setPrescriptionImage('')} className="p-3 bg-white/10 hover:bg-rose-500 rounded-xl transition relative z-10">
                          <X className="w-6 h-6 text-white" />
                       </button>
                       <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-[-20deg] translate-x-12" />
                    </div>
                 )}

                 <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-slate-100 border border-slate-100 h-full flex flex-col min-h-[500px]">
                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                       <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <Activity className="w-5 h-5 shadow-sm" />
                       </div>
                       <h3 className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px]">Real-time Clinical Stream</h3>
                    </div>
                    
                    <textarea 
                      className="flex-1 w-full bg-transparent text-slate-900 text-lg font-bold leading-relaxed outline-none resize-none placeholder:text-slate-100 placeholder:italic"
                      placeholder="Consultation data will cascade here in real-time as you speak..."
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                    />
                    
                    <div className="mt-10 pt-10 border-t border-slate-50 flex justify-center">
                       <button 
                        onClick={handleProcessTranscript}
                        disabled={loading || !transcript}
                        className="bg-indigo-600 text-white px-16 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center gap-4 disabled:opacity-50 disabled:scale-100 group"
                       >
                         {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" /> Structure with Flow Engine</>}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Preview Stage */}
      {stage === 'preview' && structuredData && (
        <div className="space-y-12 animate-fade-in">
           <header className="bg-indigo-600 rounded-[3.5rem] p-16 lg:p-20 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.3)] relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-8 relative z-10">
                 <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-105 transition-transform duration-700">
                    <CheckCircle className="w-12 h-12" />
                 </div>
                 <div>
                    <h2 className="text-5xl font-black tracking-tighter italic uppercase font-outfit">Sync Preview</h2>
                    <p className="text-indigo-100 text-lg font-medium opacity-80 mt-1">Structured medical protocol generated by Flow AI.</p>
                 </div>
              </div>
              <button 
                onClick={handleConfirm}
                disabled={loading}
                className="bg-white text-indigo-600 px-16 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-50 transition-all transform hover:-translate-y-1 flex items-center gap-4 relative z-10 group"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Archive Node <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></>}
              </button>
           </header>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-12">
                 <PreviewSection title="Clinical Domain" icon={<Activity className="w-5 h-5 text-indigo-500" />}>
                    <div className="space-y-8">
                       <PreviewField label="Identified Diagnosis">
                          <input 
                            className="w-full bg-slate-50 border border-slate-100 px-8 py-5 rounded-3xl font-black text-xl italic uppercase text-slate-900 focus:border-indigo-600 outline-none transition-all shadow-inner"
                            value={structuredData.diagnosis}
                            onChange={(e) => setStructuredData({...structuredData, diagnosis: e.target.value})}
                          />
                       </PreviewField>
                       <PreviewField label="Observed Symptoms (Comma Separated)">
                          <input 
                            className="w-full bg-slate-50 border border-slate-100 px-8 py-5 rounded-3xl font-bold text-slate-600 focus:border-indigo-600 outline-none transition-all"
                            value={structuredData.symptoms.join(', ')}
                            onChange={(e) => setStructuredData({...structuredData, symptoms: e.target.value.split(', ')})}
                          />
                       </PreviewField>
                    </div>
                 </PreviewSection>

                 <PreviewSection title="Resolution Protocol" icon={<Volume2 className="w-5 h-5 text-teal-500" />}>
                    <textarea 
                      className="w-full bg-slate-900/5 border border-indigo-100 px-8 py-8 rounded-[2.5rem] font-bold text-slate-800 italic outline-none min-h-[200px] shadow-sm leading-relaxed"
                      placeholder="Add high-level clinical resolution notes..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                    />
                 </PreviewSection>
              </div>

              <div className="space-y-12">
                 <PreviewSection title="Pharmaceutical Matrix" icon={<Zap className="w-5 h-5 text-amber-500" />}>
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-100/50">
                       <table className="w-full text-left font-bold text-sm">
                          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 px-8">
                             <tr>
                                <th className="px-8 py-6">Molecule Node</th>
                                <th className="px-8 py-6">Protocol</th>
                                <th className="px-8 py-6 text-right"></th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {structuredData.medicines.map((med, idx) => (
                               <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                                  <td className="px-8 py-6 text-slate-900 font-black italic uppercase tracking-tight">{med.name}</td>
                                  <td className="px-8 py-6 text-indigo-600 text-xs font-black uppercase tracking-tighter">{med.dosage} • {med.frequency}</td>
                                  <td className="px-8 py-6 text-right">
                                    <button 
                                      onClick={() => {
                                        const newMeds = structuredData.medicines.filter((_, i) => i !== idx);
                                        setStructuredData({...structuredData, medicines: newMeds});
                                      }}
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </PreviewSection>
                 
                 <PreviewSection title="Behavioral Advice" icon={<FileText className="w-5 h-5 text-blue-500" />}>
                    <textarea 
                       className="w-full bg-white border border-slate-200 px-8 py-8 rounded-[2.5rem] font-medium text-slate-600 outline-none min-h-[140px] shadow-sm leading-relaxed"
                       value={structuredData.advice}
                       onChange={(e) => setStructuredData({...structuredData, advice: e.target.value})}
                     />
                 </PreviewSection>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const PreviewSection = ({ title, icon, children }) => (
  <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-slate-200/40 border border-slate-100 space-y-8 animate-fade-in">
    <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
          {icon}
       </div>
       <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">{title}</h3>
    </div>
    {children}
  </div>
);

const PreviewField = ({ label, children }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] pl-3 block">{label}</label>
    {children}
  </div>
);

export default ScribeFlow;
