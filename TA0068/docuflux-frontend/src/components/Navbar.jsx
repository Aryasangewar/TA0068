import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
          <Stethoscope className="w-8 h-8" />
          <span>DocuFlux AI</span>
        </Link>

        {user && (
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-slate-600">
              Logged in as <span className="text-primary-600">{user.name}</span> ({user.role})
            </span>
            
            <div className="flex items-center gap-4">
              {user.role === 'Doctor' && (
                <Link to="/profile" className="flex items-center gap-1 text-slate-600 hover:text-primary-600 transition">
                  <UserIcon className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
              )}
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 transition font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
