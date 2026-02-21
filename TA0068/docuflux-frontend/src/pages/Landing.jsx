import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mic, CheckCircle, Activity, ArrowRight, UserCheck, Lock, Smartphone, Globe, Zap, Heart, Database, Fingerprint } from 'lucide-react';

const Landing = () => {
  return (
    <div className="bg-white selection:bg-indigo-100 selection:text-indigo-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 px-6 overflow-hidden">
        {/* Advanced Background Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] bg-teal-50/40 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 mb-10 animate-slide-up">
            <Zap className="w-3 h-3 text-indigo-600 fill-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Intelligent Clinical Infrastructure</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 leading-[0.9] tracking-tighter animate-slide-up delay-200">
            DOCUMENTATION <br /> 
            <span className="gradient-text italic">REDEFINED.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-14 leading-relaxed font-medium animate-slide-up delay-400">
            DocuFlux transforms clinical voice into structured intelligence. 
            Automated scribing with a zero-trust, patient-first privacy layer.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up delay-600">
             <Link to="/signup" className="btn-primary group">
                Initialize for Doctors
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </Link>
             <Link to="/login" className="btn-secondary">
                Patient Portal Login
             </Link>
          </div>

          {/* New "Images Grid" - Modern Dashboard Preview */}
          <div className="mt-32 relative max-w-6xl mx-auto group animate-slide-up" style={{ animationDelay: '0.8s' }}>
             <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 to-teal-500/10 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
             <div className="relative bg-white border border-slate-100 rounded-[2.5rem] p-4 shadow-2xl shadow-indigo-100/20 overflow-hidden">
                <div className="aspect-[21/9] bg-slate-50 rounded-[1.8rem] border border-slate-100 flex items-center justify-center overflow-hidden">
                   <div className="grid grid-cols-3 gap-8 w-full h-full p-12">
                      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                         <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Activity className="w-6 h-6" /></div>
                         <div>
                            <div className="h-2 w-20 bg-slate-100 rounded-full mb-2" />
                            <div className="h-2 w-12 bg-slate-50 rounded-full" />
                         </div>
                      </div>
                      <div className="bg-white rounded-3xl border border-indigo-100 shadow-md p-6 flex flex-col justify-between scale-110 relative z-10 ring-8 ring-white">
                         <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600"><Fingerprint className="w-6 h-6" /></div>
                         <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-100 rounded-full" />
                            <div className="h-2 w-full bg-slate-100 rounded-full" />
                            <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
                         </div>
                      </div>
                      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                         <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600"><Shield className="w-6 h-6" /></div>
                         <div>
                            <div className="h-2 w-16 bg-slate-100 rounded-full mb-2" />
                            <div className="h-2 w-24 bg-slate-50 rounded-full" />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Industrial USP Grid */}
      <section className="py-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Mic className="w-6 h-6" />}
              title="VitalScribe AI"
              desc="Next-gen neural engine specialized in multi-speaker clinical dialogue."
              color="text-indigo-600"
              bg="bg-indigo-50"
            />
            <FeatureCard 
              icon={<Database className="w-6 h-6" />}
              title="Structured Logic"
              desc="Automatic translation of voice to verified medical JSON structures."
              color="text-teal-600"
              bg="bg-teal-50"
            />
            <FeatureCard 
              icon={<Lock className="w-6 h-6" />}
              title="Zero-Trust Vault"
              desc="End-to-end field encryption controlled exclusively by the patient."
              color="text-rose-600"
              bg="bg-rose-50"
            />
            <FeatureCard 
              icon={<Smartphone className="w-6 h-6" />}
              title="Omni-Channel"
              desc="Access your medical footprint from any authorized node instantly."
              color="text-amber-600"
              bg="bg-amber-50"
            />
          </div>
        </div>
      </section>

      {/* "Documentation Steps" Section - High Contrast */}
      <section className="py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
           <div>
              <h2 className="text-5xl font-black text-slate-900 leading-tight mb-8">
                THE FUTURE OF <br />
                <span className="text-indigo-600">CLINICAL TRUST.</span>
              </h2>
              <div className="space-y-12">
                 <StepItem num="01" title="Real-time Capture" desc="The AI engine listens, filters environmental noise, and identifies medical intents." />
                 <StepItem num="02" title="Schema Alignment" desc="Data is mapped to specialized schemas: symptoms, diagnosis, and medication protocols." />
                 <StepItem num="03" title="Consent Handshake" desc="Patients authorize specific data nodes for doctors using their biometric unique ID." />
              </div>
           </div>
           <div className="bg-indigo-600 rounded-[3.5rem] p-16 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                 <Heart className="w-20 h-20 mb-8 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                 <p className="text-3xl font-black leading-tight italic mb-8 uppercase tracking-tighter">
                   "DocuFlux reduced my paperwork by 85%, allowing me to truly focus on the patient for the first time in years."
                 </p>
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full border border-white/20 flex items-center justify-center font-bold">DR</div>
                    <div>
                       <p className="font-bold">Dr. Sarah Chen</p>
                       <p className="text-xs text-indigo-200">Chief of Medicine, DFX Network</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <footer className="py-32 bg-slate-900 text-white overflow-hidden relative">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent)]" />
         <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-10">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Activity className="w-6 h-6" /></div>
               <span className="text-3xl font-black tracking-tighter uppercase italic">Docu<span className="text-indigo-500">Flux</span></span>
            </div>
            <p className="text-slate-500 font-medium mb-16 max-w-sm mx-auto">Digitizing the patient-doctor relationship with absolute privacy.</p>
            <div className="flex items-center justify-center gap-8 mb-20 text-xs font-black uppercase tracking-widest text-slate-500">
               <a href="#" className="hover:text-white transition">Privacy</a>
               <a href="#" className="hover:text-white transition">Nodes</a>
               <a href="#" className="hover:text-white transition">Protocols</a>
               <a href="#" className="hover:text-white transition">Security</a>
            </div>
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.4em] mb-4">© 2026 DocuFlux Health Systems • HIPAA Simulation</p>
            <p className="text-[10px] font-black text-indigo-500/50 uppercase tracking-[0.2em] italic">Design and Developed by Mohsin</p>
         </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color, bg }) => (
  <div className="medical-card group border-none shadow-none bg-transparent hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/30">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${bg} ${color} group-hover:scale-110 transition-transform duration-500`}>
      {icon}
    </div>
    <h3 className="text-xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

const StepItem = ({ num, title, desc }) => (
  <div className="flex items-start gap-8 group">
    <span className="text-5xl font-black text-slate-100 mt-[-4px] group-hover:text-indigo-100 transition-colors">{num}</span>
    <div>
      <h3 className="text-xl font-extrabold text-slate-900 mb-2 uppercase tracking-tight">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed max-w-sm">{desc}</p>
    </div>
  </div>
);

export default Landing;
