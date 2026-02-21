import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import DoctorProfile from './pages/DoctorProfile';
import Navbar from './components/Navbar';

function App() {
  const userString = localStorage.getItem('userInfo');
  const user = userString ? JSON.parse(userString) : null;

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">
          <Routes>
            {/* Landing Page for everyone */}
            <Route path="/" element={<Landing />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />
            
            {/* Unified Dashboard Route */}
            <Route 
              path="/dashboard" 
              element={
                user ? (
                  user.role === 'Doctor' ? <DoctorDashboard /> : <PatientDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            
            {/* Profile Route */}
            <Route 
              path="/profile" 
              element={user && user.role === 'Doctor' ? <DoctorProfile /> : <Navigate to="/login" />} 
            />

            {/* Catch all redirect to landing or dashboard if logged in */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
