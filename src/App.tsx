import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { UserX, Settings } from 'lucide-react';
import { supabase } from './lib/supabase';
import './lib/i18n';

// Pages
import Home from './pages/Home';
import Results from './pages/Results';
import BuyTicket from './pages/BuyTicket';
import Profile from './pages/Profile';
import OTP from './pages/OTP';
import Admin from './pages/Admin';
import POS from './pages/POS';
import Supervisor from './pages/Supervisor';
import Contact from './pages/Contact';
import Rules from './pages/Rules';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [envError, setEnvError] = useState(false);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setEnvError(true);
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          setLoading(false);
          return;
        }

        const supabaseUser = session?.user || null;
        setUser(supabaseUser);
        
        if (supabaseUser) {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('uid', supabaseUser.id)
              .single();

            if (userData) {
              let userRole = userData.role;
              
              if (supabaseUser.email === 'jeanbernardpierrelouis@gmail.com' && userRole !== 'admin') {
                userRole = 'admin';
              }
              
              setRole(userRole);
              setIsSuspended(userData.status === 'suspended');
            } else {
              if (supabaseUser.email === 'jeanbernardpierrelouis@gmail.com') {
                setRole('admin');
              } else {
                setRole('client');
              }
            }
          } catch (dbError) {
            console.error('Database error:', dbError);
            setRole(supabaseUser.email === 'jeanbernardpierrelouis@gmail.com' ? 'admin' : 'client');
          }
        } else {
          setRole(null);
          setIsSuspended(false);
        }
        setLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const supabaseUser = session?.user || null;
      setUser(supabaseUser);
      
      if (supabaseUser && event === 'SIGNED_IN') {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('uid', supabaseUser.id)
            .single();

          if (userData) {
            let userRole = userData.role;
            if (supabaseUser.email === 'jeanbernardpierrelouis@gmail.com' && userRole !== 'admin') {
              userRole = 'admin';
            }
            setRole(userRole);
            setIsSuspended(userData.status === 'suspended');
          } else {
            setRole(supabaseUser.email === 'jeanbernardpierrelouis@gmail.com' ? 'admin' : 'client');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setRole(supabaseUser.email === 'jeanbernardpierrelouis@gmail.com' ? 'admin' : 'client');
        }
      } else if (event === 'SIGNED_OUT') {
        setRole(null);
        setIsSuspended(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (envError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-yellow-100 max-w-md">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 italic uppercase tracking-tight">Configuration Requise</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Les variables d'environnement Supabase sont manquantes. Veuillez les configurer dans le menu Settings.
          </p>
          <div className="space-y-4 text-left bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm font-mono">
            <div>VITE_SUPABASE_URL</div>
            <div>VITE_SUPABASE_ANON_KEY</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserX size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Compte Suspendu</h1>
          <p className="text-gray-500 mb-6">Votre compte a été suspendu par un administrateur. Veuillez contacter le support pour plus d'informations.</p>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Layout user={user} role={role}>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/results" element={<Results />} />
              <Route path="/buy" element={<BuyTicket user={user} />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="/otp" element={<OTP />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/rules" element={<Rules />} />
              
              <Route 
                path="/admin/*" 
                element={role === 'admin' ? <Admin /> : <Navigate to="/" />} 
              />
              <Route 
                path="/pos/*" 
                element={(role === 'agent' || role === 'admin') ? <POS /> : <Navigate to="/" />} 
              />
              <Route 
                path="/supervisor/*" 
                element={(role === 'supervisor' || role === 'admin') ? <Supervisor /> : <Navigate to="/" />} 
              />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}
