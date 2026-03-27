import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserX } from 'lucide-react';
import { auth, db } from './lib/firebase';
import './lib/i18n';

// Pages
import Home from './pages/Home';
import Results from './pages/Results';
import BuyTicket from './pages/BuyTicket';
import Profile from './pages/Profile';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          let userRole = data.role;
          
          // Force admin role for the owner email if not already set
          if (firebaseUser.email === 'jeanbernardpierrelouis@gmail.com' && userRole !== 'admin') {
            userRole = 'admin';
          }
          
          setRole(userRole);
          setIsSuspended(data.status === 'suspended');
        } else {
          // If document doesn't exist yet (first login)
          if (firebaseUser.email === 'jeanbernardpierrelouis@gmail.com') {
            setRole('admin');
          } else {
            setRole('client');
          }
        }
      } else {
        setRole(null);
        setIsSuspended(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
            onClick={() => auth.signOut()}
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
