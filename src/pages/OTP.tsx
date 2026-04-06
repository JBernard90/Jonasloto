import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Key, Mail, ArrowRight, AlertCircle, 
  CheckCircle2, RefreshCw, Smartphone
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

export default function OTP() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes

  const email = location.state?.email;
  const userId = location.state?.userId;

  useEffect(() => {
    if (!email || !userId) {
      navigate('/profile');
      return;
    }

    // Start countdown
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Initial OTP send
    sendOTP().catch(err => console.error('Jonas Loto Center: Error in initial sendOTP:', err));

    return () => clearInterval(interval);
  }, []);

  const sendOTP = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    try {
      // Store OTP in Supabase
      const { error: otpError } = await supabase.from('otps').insert({
        userId,
        code,
        type: 'email',
        expiresAt
      });

      if (otpError) throw otpError;

      // Send OTP via backend
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        throw new Error('Le serveur a renvoyé une réponse invalide (Erreur de routage).');
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Échec de l\'envoi de l\'e-mail.');

    } catch (err: any) {
      console.error('OTP Send Error:', err);
      setError(err.message || 'Impossible d\'envoyer le code. Veuillez réessayer.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await sendOTP();
      setTimer(600);
    } catch (err: any) {
      console.error('Jonas Loto Center: handleResend error:', err);
      setError(err.message || "Erreur lors du renvoi de l'OTP.");
    } finally {
      setResending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase
        .from('otps')
        .select('*')
        .eq('userId', userId)
        .eq('code', code)
        .gt('expiresAt', new Date().toISOString())
        .single();

      if (verifyError || !data) {
        throw new Error(t('invalid_otp'));
      }

      // Mark OTP as used (optional, or just delete)
      await supabase.from('otps').delete().eq('id', data.id);

      // Set session verification flag
      sessionStorage.setItem('otp_verified', 'true');

      // Successfully verified
      navigate('/profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-slate-50 dark:bg-dark-bg">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <div className="inline-block mb-6">
            <Logo className="w-24 h-24" />
          </div>
          <h1 className="text-4xl font-black text-primary dark:text-secondary tracking-tighter uppercase italic leading-none mb-2">
            {t('otp_verification')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {t('otp_sent')} <span className="text-primary dark:text-secondary font-bold">{email}</span>
          </p>
        </div>

        <div className="card p-8 md:p-10">
          <form onSubmit={handleVerify} className="space-y-8">
            <div className="flex justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-16 text-center text-3xl font-black bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all dark:bg-dark-bg dark:border-dark-border dark:text-white dark:focus:border-secondary dark:focus:ring-secondary/10"
                  required
                />
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
              <div className="text-slate-400">
                Expire dans : <span className={timer < 60 ? "text-accent" : "text-primary dark:text-secondary"}>{formatTime(timer)}</span>
              </div>
              <button 
                type="button"
                onClick={handleResend}
                disabled={resending || timer > 540}
                className="text-primary hover:underline disabled:opacity-50 dark:text-secondary flex items-center gap-1"
              >
                <RefreshCw size={14} className={resending ? "animate-spin" : ""} /> {t('resend_otp')}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl flex items-center gap-3 text-accent text-xs font-bold">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || otp.some(d => !d)}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 size={20} /> {t('verify_otp')}
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-dark-border text-center">
            <p className="text-xs text-slate-400 font-medium">
              Vous n'avez pas reçu l'e-mail ? Vérifiez vos spams ou essayez une autre adresse.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
