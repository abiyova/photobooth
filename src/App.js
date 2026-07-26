import './App.css';
import './styles/photobooth.css';
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Photobooth from "./components/Photobooth";
import Login from "./components/Login";
import Admin from "./components/Admin";
import "./styles/global.css";
import "./styles/admin.css";
import { supabase } from "./supabase";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Router>
      <div className="App">
        <div className="app-logo-bar">
          <h1 className="app-logo-title">
            Photobooth
          </h1>
        </div>

        <div className="app-content">
          <Routes>
            <Route path="/" element={session ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/booth" />) : <Login />} />
            <Route path="/booth" element={session && !isAdmin ? <Photobooth user={session.user} /> : <Navigate to="/" />} />
            <Route path="/admin" element={session && isAdmin ? <Admin /> : <Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
