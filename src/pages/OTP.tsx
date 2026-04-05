import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, CheckCircle2, Loader, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function OTP() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  // STEP 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      setSuccess('✅ Code OTP envoyé à votre email!');
      setStep(2);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP and Auto-Login
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otp) {
        throw new Error('OTP code is required');
      }

      // Verify OTP via server
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      if (!response.ok) {
        throw new Error('Invalid or expired OTP code');
      }

      // If signup: create user in database
      if (isSignup) {
        const { error: dbError } = await supabase
          .from('users')
          .insert({
            uid: email, // Use email as temporary ID
            email,
            displayName,
            phoneNumber,
            role: 'client',
            status: 'active'
          });

        if (dbError && !dbError.message.includes('duplicate')) {
          throw dbError;
        }
      }

      setSuccess('✅ OTP vérifié avec succès!');
      setStep(3);

      // Auto-login after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 w-full max-w-md"
      >
        {/* STEP 1: Email */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">
              {isSignup ? 'Inscription' : 'Connexion'}
            </h1>
            <p className="text-gray-500 mb-6 text-sm">
              {isSignup 
                ? 'Créez votre compte avec un code OTP' 
                : 'Connectez-vous avec un code OTP'}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSendOTP} className="space-y-4 mb-6">
              {isSignup && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                      Nom Complet
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                      placeholder="Jean Pierre"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                      Téléphone (optionnel)
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                      placeholder="+509 2812-3456"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                    placeholder="vous@exemple.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                {loading && <Loader size={18} className="animate-spin" />}
                Envoyer le code OTP
              </button>
            </form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            <p className="text-center text-gray-500 text-sm">
              {isSignup 
                ? 'Vous avez déjà un compte? ' 
                : 'Pas encore de compte? '}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setEmail('');
                  setDisplayName('');
                  setPhoneNumber('');
                }}
                className="text-primary font-bold hover:underline"
              >
                {isSignup ? 'Se connecter' : 'S\'inscrire'}
              </button>
            </p>
          </>
        )}

        {/* STEP 2: OTP Code */}
        {step === 2 && (
          <>
            <button
              onClick={handleBackToEmail}
              className="flex items-center gap-2 text-primary font-bold mb-6 hover:gap-3 transition-all"
            >
              <ArrowLeft size={18} /> Retour
            </button>

            <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
              Vérification du code
            </h1>
            <p className="text-gray-500 mb-6 text-sm">
              Nous avons envoyé un code à <strong>{email}</strong>
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                  Code OTP (6 chiffres)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-black bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none tracking-widest"
                  placeholder="000000"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-2">
                  Valide pendant 10 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                {loading && <Loader size={18} className="animate-spin" />}
                Vérifier le code
              </button>
            </form>

            <button
              onClick={handleSendOTP}
              className="w-full text-primary font-bold text-sm hover:underline"
            >
              Renvoyer le code
            </button>
          </>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <CheckCircle2 size={64} className="text-green-500" />
              </motion.div>
            </div>

            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">
                ✅ Succès!
              </h1>
              <p className="text-gray-500">
                {isSignup 
                  ? 'Votre compte a été créé avec succès!' 
                  : 'Vous êtes connecté!'}
              </p>
            </div>

            <p className="text-[12px] text-gray-400">
              Redirection en cours...
            </p>

            <div className="flex justify-center">
              <Loader size={24} className="animate-spin text-primary" />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
