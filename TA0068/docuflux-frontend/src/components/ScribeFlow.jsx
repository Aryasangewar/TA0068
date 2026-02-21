import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { processTranscript, saveCase } from '../services/data';

const ScribeFlow = ({ patientId, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [structuredData, setStructuredData] = useState(null);
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);

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
    setLoading(true);
    try {
      await saveCase({
        patientId,
        transcript,
        structuredData
      });
      onComplete();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save case.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary-600" />
          AI Medical Scribe
        </h2>
        <button
          onClick={toggleRecording}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition ${
            isRecording 
            ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' 
            : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Transcript Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Consultation Transcript</label>
          <div className="w-full min-h-[150px] p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus-within:ring-2 focus-within:ring-primary-500 transition">
            <textarea
              className="w-full h-full bg-transparent outline-none resize-none"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Recording will appear here..."
              rows={5}
            />
          </div>
        </div>

        {transcript && !structuredData && (
          <button
            onClick={handleProcessTranscript}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Processing with AI...' : 'Generate Structured Report'}
          </button>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Structured Data Form */}
        {structuredData && (
          <div className="mt-8 border-t border-slate-100 pt-8 space-y-6 bg-primary-50/30 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-slate-900 border-b border-primary-100 pb-2 mb-4">Medical Documentation Review</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms</label>
                <input
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white"
                  value={structuredData.symptoms.join(', ')}
                  onChange={(e) => setStructuredData({...structuredData, symptoms: e.target.value.split(', ')})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                <input
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white"
                  value={structuredData.diagnosis}
                  onChange={(e) => setStructuredData({...structuredData, diagnosis: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medicines</label>
              <div className="space-y-2">
                {structuredData.medicines.map((med, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2">
                    <input className="px-2 py-1 border rounded" value={med.name} onChange={(e) => {
                      const newMeds = [...structuredData.medicines];
                      newMeds[idx].name = e.target.value;
                      setStructuredData({...structuredData, medicines: newMeds});
                    }} placeholder="Name" />
                    <input className="px-2 py-1 border rounded" value={med.dosage} onChange={(e) => {
                      const newMeds = [...structuredData.medicines];
                      newMeds[idx].dosage = e.target.value;
                      setStructuredData({...structuredData, medicines: newMeds});
                    }} placeholder="Dosage" />
                    <input className="px-2 py-1 border rounded" value={med.frequency} onChange={(e) => {
                      const newMeds = [...structuredData.medicines];
                      newMeds[idx].frequency = e.target.value;
                      setStructuredData({...structuredData, medicines: newMeds});
                    }} placeholder="Freq" />
                    <input className="px-2 py-1 border rounded" value={med.duration} onChange={(e) => {
                      const newMeds = [...structuredData.medicines];
                      newMeds[idx].duration = e.target.value;
                      setStructuredData({...structuredData, medicines: newMeds});
                    }} placeholder="Dur" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Advice</label>
              <textarea
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white"
                rows={3}
                value={structuredData.advice}
                onChange={(e) => setStructuredData({...structuredData, advice: e.target.value})}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
              >
                <CheckCircle className="w-5 h-5" />
                {loading ? 'Saving...' : 'Confirm & E-Sign'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScribeFlow;
