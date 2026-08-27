import './App.css';
import './styles/photobooth.css';
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Photobooth from "./components/Photobooth";
import Login from "./components/Login";
import Admin from "./components/Admin";
import { ToastProvider } from "./components/Toast";
import "./styles/global.css";
import "./styles/admin.css";
import { supabase } from "./supabase";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  const isAdmin = session?.user?.email?.toLowerCase().includes('admin');

  const handleLogoClick = () => {
    setResetKey((k) => k + 1);
  };

  return (
    <ToastProvider>
      <Router>
        <div className="App">
          <div className="app-logo-bar">
            <h1 className="app-logo-title" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
              Photobooth
            </h1>
          </div>

          <div className="app-content">
            <Routes>
              <Route path="/" element={session ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/booth" />) : <Login />} />
              <Route path="/booth" element={session && !isAdmin ? <Photobooth key={resetKey} user={session.user} /> : <Navigate to="/" />} />
              <Route path="/admin" element={session && isAdmin ? <Admin /> : <Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
