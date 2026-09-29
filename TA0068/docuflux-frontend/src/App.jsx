import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import DoctorProfile from './pages/DoctorProfile';
import Navbar from './components/Navbar';

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
const getUser = () => {
    try {
        const str = sessionStorage.getItem('userInfo');
        return str ? JSON.parse(str) : null;
    } catch {
        return null;
    }
};

// ─── Auth Guard ───────────────────────────────────────────────────────────────
const PrivateRoute = ({ children, requiredRole }) => {
    const user = getUser();
    if (!user?.token) return <Navigate to="/login" replace />;
    if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" replace />;
    return children;
};

// ─── Role-Based Dashboard Router ─────────────────────────────────────────────
const DashboardRoute = () => {
    const user = getUser();
    if (!user?.token) return <Navigate to="/login" replace />;
    if (user.role === 'Patient') return <PatientDashboard />;
    return <DoctorDashboard />;
};

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
    // Track auth state reactively so Navbar/routing updates without page refresh
    const [user, setUser] = useState(getUser);

    useEffect(() => {
        // Listen for sessionStorage changes triggered by login/logout
        const syncAuth = () => setUser(getUser());

        // Custom event dispatched by Login/Signup/Logout
        window.addEventListener('auth-change', syncAuth);
        return () => window.removeEventListener('auth-change', syncAuth);
    }, []);

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
                <Navbar />
                <main className="min-h-[calc(100vh-80px)]">
                    <Routes>
                        {/* Public */}
                        <Route path="/" element={<Landing />} />

                        {/* Auth routes — redirect if already logged in */}
                        <Route
                            path="/login"
                            element={user?.token ? <Navigate to="/dashboard" replace /> : <Login onAuth={() => setUser(getUser())} />}
                        />
                        <Route
                            path="/signup"
                            element={user?.token ? <Navigate to="/dashboard" replace /> : <Signup onAuth={() => setUser(getUser())} />}
                        />

                        {/* Dashboard — role-based */}
                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute>
                                    <DashboardRoute />
                                </PrivateRoute>
                            }
                        />

                        {/* Profile — Doctors only */}
                        <Route
                            path="/profile"
                            element={
                                <PrivateRoute requiredRole="Doctor">
                                    <DoctorProfile />
                                </PrivateRoute>
                            }
                        />

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to={user?.token ? '/dashboard' : '/'} replace />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
