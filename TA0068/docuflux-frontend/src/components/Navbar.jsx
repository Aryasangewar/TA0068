import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, LogOut, User, Menu, X, Shield, History, Clipboard, Zap } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
  };

  return (
    <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 h-20">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo Redesign */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 group-hover:scale-105 transition-all duration-300">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter font-outfit">Docu<span className="text-indigo-600 uppercase italic">Flux</span></span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10">
          {user ? (
            <>
              <nav className="flex items-center gap-8">
                <NavLink to="/dashboard" active={location.pathname === '/dashboard'} label="Infrastructure" icon={<Activity className="w-4 h-4" />} />
                {user.role === 'Doctor' && (
                  <NavLink to="/profile" active={location.pathname === '/profile'} label="Clinical Node" icon={<User className="w-4 h-4" />} />
                )}
              </nav>
              <div className="h-8 w-px bg-slate-100" />
              <div className="flex items-center gap-4 pl-2">
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.role}</p>
                   <p className="text-sm font-bold text-slate-900">{user.name}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-100"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-6">
              <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Port Access</Link>
              <Link 
                to="/signup" 
                className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5"
              >
                Join Network
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-slate-900 p-2">
          {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 p-8 space-y-6 shadow-2xl animate-slide-up">
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block text-lg font-bold text-slate-900">Infrastructure</Link>
              {user.role === 'Doctor' && <Link to="/profile" onClick={() => setIsOpen(false)} className="block text-lg font-bold text-slate-900">Clinical Node</Link>}
              <button onClick={handleLogout} className="w-full text-left py-4 font-bold text-rose-500 border-t border-slate-50 mt-4">Disconnect Session</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsOpen(false)} className="block text-lg font-bold text-slate-900">Port Access</Link>
              <Link to="/signup" onClick={() => setIsOpen(false)} className="block py-5 bg-indigo-600 text-white text-center rounded-2xl font-bold">Join Network</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ to, active, label, icon }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-2 text-sm font-bold transition-all ${
      active ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
    }`}
  >
    <span className={`${active ? 'text-indigo-600' : 'text-slate-300'}`}>{icon}</span>
    {label}
  </Link>
);

export default Navbar;
