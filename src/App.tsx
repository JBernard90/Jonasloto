import React, { Suspense, useEffect, useState, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { UserX, Settings } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
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
import NotificationToast, { Notification } from './components/NotificationToast';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [envError, setEnvError] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => removeNotification(id), 6000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Jonas Loto Center: Unhandled Promise Rejection:', {
        reason: event.reason,
        promise: event.promise,
        message: event.reason?.message || 'No message',
        stack: event.reason?.stack || 'No stack'
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Real-time listeners
    let drawsChannel: any;
    let ticketsChannel: any;

    if (isSupabaseConfigured) {
      try {
        drawsChannel = supabase
          .channel('draws-realtime')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'draws' }, (payload) => {
            addNotification(
              'Nouveau Tirage !',
              `Le tirage ${payload.new.type} est disponible. Vérifiez vos billets !`,
              'info'
            );
          })
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              console.error('Jonas Loto Center: Draws channel subscription error - check your Supabase Realtime configuration and table publications');
            }
          });

        ticketsChannel = supabase
          .channel('tickets-realtime')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, (payload) => {
            if (payload.new.status === 'won') {
              addNotification(
                'Félicitations !',
                `Votre billet #${payload.new.id.slice(0, 8)} est gagnant !`,
                'success'
              );
            }
          })
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              console.error('Jonas Loto Center: Tickets channel subscription error - check your Supabase Realtime configuration and table publications');
            }
          });
      } catch (err) {
        console.error('Jonas Loto Center: Error setting up real-time listeners:', err);
      }
    }

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      if (drawsChannel) supabase.removeChannel(drawsChannel).catch((err: any) => console.error('Jonas Loto Center: Error removing draws channel:', err));
      if (ticketsChannel) supabase.removeChannel(ticketsChannel).catch((err: any) => console.error('Jonas Loto Center: Error removing tickets channel:', err));
    };
  }, []);

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
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 15) : 'none',
      hasKey: !!supabaseAnonKey,
      keyLength: supabaseAnonKey?.length || 0
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Jonas Loto Center: Supabase configuration missing! Check Vercel environment variables.');
      setEnvError(true);
      setLoading(false);
      return;
    }

    const authTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Jonas Loto Center: Auth state change timed out, forcing loading to false');
        setLoading(false);
      }
    }, 3000); // Reduced to 3 seconds for better UX

    let subscription: any;
    try {
      // Get initial session quickly
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          handleAuthStateChange('INITIAL', session);
        } else {
          setLoading(false);
        }
      }).catch(err => {
        console.error('Jonas Loto Center: Error getting initial session:', err);
        setLoading(false);
      });

      const result = supabase.auth.onAuthStateChange(async (event, session) => {
        handleAuthStateChange(event, session);
      });
      subscription = result.data.subscription;
    } catch (err) {
      console.error('Jonas Loto Center: Critical error during onAuthStateChange setup:', err);
      setLoading(false);
    }

    async function handleAuthStateChange(event: string, session: any) {
      clearTimeout(authTimeout);
      try {
        const supabaseUser = session?.user || null;
        setUser(supabaseUser);
        
        if (supabaseUser) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('uid', supabaseUser.id)
            .maybeSingle();

          if (error) {
            console.error('Jonas Loto Center: Error fetching user data:', error);
          }

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
    }

    return () => {
      clearTimeout(authTimeout);
      if (subscription) subscription.unsubscribe();
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
        <div className="mb-8 animate-pulse">
          <Logo className="w-48 h-48 text-white" />
        </div>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary animate-[loading_2s_ease-in-out_infinite]"
            style={{ width: "100%" }}
          />
        </div>
        <p className="mt-4 text-white/50 font-black uppercase tracking-widest text-[10px] italic">
          Chargement de Jonas Loto...
        </p>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
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
            onClick={async () => {
              try {
                await supabase.auth.signOut();
              } catch (err) {
                console.error('Jonas Loto Center: Error during sign out:', err);
              }
            }}
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
        <NotificationToast notifications={notifications} removeNotification={removeNotification} />
      </Router>
    </ErrorBoundary>
  );
}
