import React, { useState, useEffect } from 'react';
import ScribeFlow from '../components/ScribeFlow';
import { getCases } from '../services/data';
import {
   Users,
   PlusCircle,
   History,
   LayoutDashboard,
   Settings,
   Search,
   Bell,
   Calendar,
   Clock,
   ArrowUpRight,
   Filter,
   MoreVertical,
   Activity,
   CheckCircle2,
   Timer
} from 'lucide-react';

const DoctorDashboard = () => {
   const [view, setView] = useState('dashboard'); // 'dashboard' or 'new-scribe'
   const [cases, setCases] = useState([]);
   const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchCases();
   }, []);

   const fetchCases = async () => {
      try {
         const data = await getCases();
         setCases(data);
         const completed = data.filter(c => c.status === 'Completed').length;
         setStats({
            total: data.length,
            active: data.length - completed,
            completed: completed
         });
      } catch (err) {
         console.error('Failed to fetch cases');
      } finally {
         setLoading(false);
      }
   };

   const doctorInfo = JSON.parse(localStorage.getItem('userInfo'));

   return (
      <div className="flex min-h-[calc(100vh-64px)] bg-[#F3F4F6]">
         {/* Sidebar Redesign */}
         <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden lg:flex sticky top-16 h-[calc(100vh-64px)]">
            <div className="p-8 space-y-8 flex-1">
               <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4">Menu</p>
                  <nav className="space-y-1">
                     <SidebarLink
                        active={view === 'dashboard'}
                        onClick={() => setView('dashboard')}
                        icon={<LayoutDashboard className="w-5 h-5" />}
                        label="Clinical Overview"
                     />
                     <SidebarLink
                        active={view === 'new-scribe'}
                        onClick={() => setView('new-scribe')}
                        icon={<PlusCircle className="w-5 h-5" />}
                        label="New Consultation"
                     />
                     <SidebarLink
                        icon={<Users className="w-5 h-5" />}
                        label="Patient Directory"
                     />
                     <SidebarLink
                        icon={<History className="w-5 h-5" />}
                        label="Case Archives"
                     />
                  </nav>
               </div>

               <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4">Settings</p>
                  <nav className="space-y-1">
                     <SidebarLink icon={<Settings className="w-5 h-5" />} label="Scribe Settings" />
                     <SidebarLink icon={<Bell className="w-5 h-5" />} label="Notifications" />
                  </nav>
               </div>
            </div>

            {/* Doctor Identity */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-100">
                     {doctorInfo.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                     <p className="text-sm font-bold text-slate-900 truncate">Dr. {doctorInfo.name}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Medical Professional</p>
                  </div>
               </div>
            </div>
         </aside>

         {/* Main Content Area */}
         <main className="flex-1 p-6 lg:p-10 space-y-10 overflow-auto">
            {view === 'dashboard' ? (
               <>
                  {/* Header */}
                  <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="animate-fade-in">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Physician Dashboard</h1>
                        <p className="text-slate-500 font-medium mt-1">Practice Overview for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                     </div>
                     <div className="flex items-center gap-4 animate-fade-in delay-1">
                        <div className="bg-white p-2 border border-slate-200 rounded-2xl flex items-center gap-2">
                           <Search className="w-5 h-5 text-slate-400 ml-2" />
                           <input type="text" placeholder="Search patients..." className="bg-transparent border-none outline-none text-sm w-48 font-medium" />
                        </div>
                        <button
                           onClick={() => setView('new-scribe')}
                           className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-1"
                        >
                           <PlusCircle className="w-5 h-5" />
                           New Scribe
                        </button>
                     </div>
                  </header>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <StatCard
                        title="Total Consultations"
                        value={stats.total}
                        icon={<Activity className="w-6 h-6 text-indigo-600" />}
                        bg="bg-indigo-50"
                        trend="+12% from last week"
                     />
                     <StatCard
                        title="Active Portals"
                        value={stats.active}
                        icon={<Timer className="w-6 h-6 text-amber-600" />}
                        bg="bg-amber-50"
                        trend="Requires clinical entry"
                     />
                     <StatCard
                        title="Verified Archives"
                        value={stats.completed}
                        icon={<CheckCircle2 className="w-6 h-6 text-teal-600" />}
                        bg="bg-teal-50"
                        trend="Documented & finalized"
                     />
                  </div>

                  {/* Recent Cases Section */}
                  <section className="space-y-6">
                     <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                           <Clock className="w-5 h-5 text-slate-400" />
                           Recent Clinical Documents
                        </h2>
                        <div className="flex items-center gap-2">
                           <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition">
                              <Filter className="w-4 h-4" />
                           </button>
                           <button className="text-primary text-sm font-bold px-4 py-2 hover:bg-blue-50 rounded-xl transition">View All</button>
                        </div>
                     </div>

                     <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <tr>
                                 <th className="px-8 py-5">Patient Identity</th>
                                 <th className="px-8 py-5">Clinical Port Address</th>
                                 <th className="px-8 py-5">Last Encounter</th>
                                 <th className="px-8 py-5">Vault Status</th>
                                 <th className="px-8 py-5"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {loading ? (
                                 <tr><td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-bold italic animate-pulse">Synchronizing clinical data...</td></tr>
                              ) : cases.length === 0 ? (
                                 <tr><td colSpan="5" className="px-8 py-16 text-center text-slate-400">No recent consultations found. Start a new scribe session to begin.</td></tr>
                              ) : (
                                 cases.map((c) => (
                                    <tr key={c._id} className="hover:bg-slate-50/50 transition cursor-pointer group">
                                       <td className="px-8 py-5">
                                          <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-sm tracking-tighter">
                                                {c.patientId?.name?.substring(0, 2).toUpperCase() || 'P'}
                                             </div>
                                             <div>
                                                <p className="text-sm font-bold text-slate-900">{c.patientId?.name || 'Anonymous Patient'}</p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase">Standard Health ID</p>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-8 py-5">
                                          <span className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">#{c._id.slice(-8)}</span>
                                       </td>
                                       <td className="px-8 py-5 whitespace-nowrap">
                                          <p className="text-sm font-bold text-slate-700">{new Date(c.createdAt).toLocaleDateString()}</p>
                                          <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                       </td>
                                       <td className="px-8 py-5">
                                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${c.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                             }`}>
                                             <div className={`w-1 h-1 rounded-full ${c.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
                                             {c.status}
                                          </span>
                                       </td>
                                       <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition">
                                          <button className="text-slate-400 hover:text-primary">
                                             <ArrowUpRight className="w-5 h-5" />
                                          </button>
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </section>
               </>
            ) : (
               <div className="animate-fade-in">
                  <header className="flex items-center justify-between mb-10">
                     <div>
                        <button
                           onClick={() => setView('dashboard')}
                           className="text-primary text-sm font-bold flex items-center gap-2 mb-4 hover:gap-1 transition-all"
                        >
                           <ArrowUpRight className="w-4 h-4 rotate-[225deg]" />
                           Back to Overview
                        </button>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Clinical Port Initialize</h1>
                     </div>
                  </header>
                  <ScribeFlow onComplete={() => {
                     fetchCases();
                     setView('dashboard');
                  }} />
               </div>
            )}

            <footer className="mt-20 pt-10 border-t border-slate-200 text-center pb-10">
               <p className="text-[10px] font-black text-indigo-500/30 uppercase tracking-[0.2em] italic">git fetch origin
                  git reset --hard origin/main
                  git clean -fd</p>
            </footer>
         </main>
      </div>
   );
};

const SidebarLink = ({ active, onClick, icon, label }) => (
   <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
         }`}
   >
      {icon}
      {label}
   </button>
);

const StatCard = ({ title, value, icon, bg, trend }) => (
   <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg}`}>
            {icon}
         </div>
         <MoreVertical className="w-5 h-5 text-slate-300" />
      </div>
      <div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
         <h3 className="text-4xl font-extrabold text-slate-900 tracking-tighter">{value}</h3>
      </div>
      <div className="pt-2">
         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {trend}
         </div>
      </div>
   </div>
);

export default DoctorDashboard;
