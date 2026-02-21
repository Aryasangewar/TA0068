import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, CheckCircle, Plus, Trash2, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { processTranscript, saveCase } from '../services/data';

const ScribeFlow = ({ patientId, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [structuredData, setStructuredData] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [prescriptionImage, setPrescriptionImage] = useState('');
  const [error, setError] = useState('');
  
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
    } catch (err) {
      setError('AI processing failed. Please try again or type manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!structuredData) return setError('Please generate or enter structured report first.');
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
      setError(err.response?.data?.message || 'Failed to save case.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
          <Mic className="w-6 h-6 text-primary-600" />
          Live AI Medical Scribe
        </h2>
        <div className="flex gap-2">
           <button
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            <Upload className="w-4 h-4" />
            Upload Prescription
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*"
          />
          <button
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold shadow-sm transition ${
              isRecording 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4" />}
            {isRecording ? 'Stop Recording' : 'Start Scribe'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {prescriptionImage && (
          <div className="relative inline-block group">
            <img src={prescriptionImage} alt="Prescription" className="h-32 rounded-lg border-2 border-primary-100 shadow-sm" />
            <button 
              onClick={() => setPrescriptionImage('')}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition"
            >
              <X className="w-3 h-3" />
            </button>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase text-center">Prescription Attached</p>
          </div>
        )}

        {/* Transcript Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Consultation Transcript
            </label>
            {isRecording && <span className="text-xs font-bold text-red-500 animate-pulse flex items-center gap-1">● Listening...</span>}
          </div>
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus-within:ring-2 focus-within:ring-primary-500/20 transition">
            <textarea
              className="w-full min-h-[120px] bg-transparent outline-none resize-none text-slate-800 leading-relaxed"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Recording will appear here or you can type manually..."
              rows={4}
            />
          </div>
        </div>

        {transcript && !structuredData && (
          <div className="flex justify-center">
            <button
              onClick={handleProcessTranscript}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              {loading ? 'Analyzing with AI...' : 'Analyze & Generate Clinical Report'}
            </button>
          </div>
        )}

        {error && <p className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">⚠️ {error}</p>}

        {/* Structured Data Form */}
        {structuredData && (
          <div className="mt-8 border-t border-slate-100 pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Clinical Documentation Preview</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Symptoms (Comma separated)</label>
                <input
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                  value={structuredData.symptoms.join(', ')}
                  onChange={(e) => setStructuredData({...structuredData, symptoms: e.target.value.split(', ')})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Diagnosis</label>
                <input
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                  value={structuredData.diagnosis}
                  onChange={(e) => setStructuredData({...structuredData, diagnosis: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medication List</label>
                <button 
                  onClick={() => setStructuredData({...structuredData, medicines: [...structuredData.medicines, {name: '', dosage: '', frequency: '', duration: ''}]})}
                  className="text-primary-600 hover:text-primary-700 text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Medicine
                </button>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2 border-b">Name</th>
                      <th className="px-4 py-2 border-b">Dosage</th>
                      <th className="px-4 py-2 border-b">Frequency</th>
                      <th className="px-4 py-2 border-b">Duration</th>
                      <th className="px-4 py-2 border-b"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {structuredData.medicines.map((med, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-4 py-2"><input className="w-full bg-transparent outline-none" value={med.name} onChange={(e) => {
                          const newMeds = [...structuredData.medicines];
                          newMeds[idx].name = e.target.value;
                          setStructuredData({...structuredData, medicines: newMeds});
                        }} /></td>
                        <td className="px-4 py-2"><input className="w-full bg-transparent outline-none" value={med.dosage} onChange={(e) => {
                          const newMeds = [...structuredData.medicines];
                          newMeds[idx].dosage = e.target.value;
                          setStructuredData({...structuredData, medicines: newMeds});
                        }} /></td>
                        <td className="px-4 py-2"><input className="w-full bg-transparent outline-none" value={med.frequency} onChange={(e) => {
                          const newMeds = [...structuredData.medicines];
                          newMeds[idx].frequency = e.target.value;
                          setStructuredData({...structuredData, medicines: newMeds});
                        }} /></td>
                        <td className="px-4 py-2"><input className="w-full bg-transparent outline-none" value={med.duration} onChange={(e) => {
                          const newMeds = [...structuredData.medicines];
                          newMeds[idx].duration = e.target.value;
                          setStructuredData({...structuredData, medicines: newMeds});
                        }} /></td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => {
                            const newMeds = structuredData.medicines.filter((_, i) => i !== idx);
                            setStructuredData({...structuredData, medicines: newMeds});
                          }} className="text-red-400 hover:text-red-600 transition"><Trash2 className="w-3 h-3" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lifestyle Advice & Notes</label>
              <textarea
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                rows={2}
                value={structuredData.advice}
                onChange={(e) => setStructuredData({...structuredData, advice: e.target.value})}
              />
            </div>

            {/* Resolution Section */}
            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
              <label className="block text-sm font-bold text-blue-900 border-b border-blue-100 pb-2">Treatment Resolution Summary</label>
              <textarea
                className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-blue-800"
                rows={3}
                placeholder="Briefly summarize the follow-up plan or resolution..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex items-center gap-3 bg-emerald-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition shadow-xl shadow-emerald-200 disabled:opacity-50"
              >
                <CheckCircle className="w-6 h-6" />
                {loading ? 'Documenting...' : 'Finalize & E-Sign Case'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScribeFlow;
