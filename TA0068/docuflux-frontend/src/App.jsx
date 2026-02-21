import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import DoctorProfile from './pages/DoctorProfile';
import Navbar from './components/Navbar';

function App() {
  const user = JSON.parse(localStorage.getItem('userInfo'));

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
            
            <Route 
              path="/" 
              element={
                user ? (
                  user.role === 'Doctor' ? <DoctorDashboard /> : <PatientDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            
            <Route 
              path="/profile" 
              element={user && user.role === 'Doctor' ? <DoctorProfile /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
