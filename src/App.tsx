import React, { Suspense, useEffect, useState, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { UserX, Settings } from 'lucide-react';
import { supabase } from './lib/supabase';
import './lib/i18n';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Results = lazy(() => import('./pages/Results'));
const BuyTicket = lazy(() => import('./pages/BuyTicket'));
const Profile = lazy(() => import('./pages/Profile'));
const OTP = lazy(() => import('./pages/OTP'));
const Admin = lazy(() => import('./pages/Admin'));
const POS = lazy(() => import('./pages/POS'));
const Supervisor = lazy(() => import('./pages/Supervisor'));
const Contact = lazy(() => import('./pages/Contact'));
const Rules = lazy(() => import('./pages/Rules'));

import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Logo from './components/Logo';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [envError, setEnvError] = useState(false);

  useEffect(() => {
    console.log('Jonas Loto Center: App component mounted');
    
    let supabaseUrl: string | undefined;
    let supabaseAnonKey: string | undefined;

    try {
      supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl && typeof process !== 'undefined') {
        supabaseUrl = process.env.VITE_SUPABASE_URL;
      }
      if (!supabaseAnonKey && typeof process !== 'undefined') {
        supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
      }
    } catch (e) {
      console.error('Jonas Loto Center: Error accessing env vars:', e);
    }

    console.log('Jonas Loto Center: Supabase Config Check:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseAnonKey
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Jonas Loto Center: Supabase configuration missing!');
      setEnvError(true);
      setLoading(false);
      return;
    }

    const authTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Jonas Loto Center: Auth state change timed out, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      clearTimeout(authTimeout);
      try {
        const supabaseUser = session?.user || null;
        setUser(supabaseUser);
        
        if (supabaseUser) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('uid', supabaseUser.id)
            .single();

          if (userData) {
            let userRole = userData.role;
            
            // Force admin role for the owner email if not already set
            const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
            if (supabaseUser.email === adminEmail && userRole !== 'admin') {
              userRole = 'admin';
            }
            
            setRole(userRole);
            setIsSuspended(userData.status === 'suspended');
          } else {
            // If document doesn't exist yet (first login)
            const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
            if (supabaseUser.email === adminEmail) {
              setRole('admin');
            } else {
              setRole('client');
            }
          }
        } else {
          setRole(null);
          setIsSuspended(false);
        }
      } catch (err) {
        console.error('Jonas Loto Center: Auth state change error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
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
            Les variables d'environnement Supabase sont manquantes. Veuillez les configurer dans le menu <strong>Settings</strong> de Google AI Studio.
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
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4 dark:bg-black">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          className="mb-8"
        >
          <Logo className="w-48 h-48 text-white" />
        </motion.div>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-secondary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <p className="mt-4 text-white/50 font-black uppercase tracking-widest text-[10px] italic">
          Chargement de Jonas Loto...
        </p>
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
          <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin dark:border-secondary dark:border-t-transparent"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/results" element={<Results />} />
              <Route path="/buy-ticket" element={<BuyTicket user={user} />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="/otp" element={<OTP />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/rules" element={<Rules />} />
              
              {/* Protected Routes */}
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
