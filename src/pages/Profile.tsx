import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, Mail, Lock, History, Star, 
  Smartphone, LogOut, ChevronRight, Ticket, 
  Wallet, PlusCircle, ArrowUpCircle, Calendar, 
  Edit2, Save, X, AlertCircle, ShieldCheck, CheckCircle2,
  ArrowDownCircle, ArrowRightLeft, Key, Settings
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Logo from '../components/Logo';

export default function Profile({ user: initialUser }: { user?: any }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(initialUser || null);
  const [userData, setUserData] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [idType, setIdType] = useState<'passport' | 'license' | 'cin'>('cin');
  const [idNumber, setIdNumber] = useState('');
  const [idPhotoFront, setIdPhotoFront] = useState<File | null>(null);
  const [idPhotoBack, setIdPhotoBack] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        // Mandatory OTP check for every session
        const isVerified = sessionStorage.getItem('otp_verified') === 'true';
        if (!isVerified) {
          navigate('/otp', { state: { email: currentUser.email, userId: currentUser.id } });
          return;
        }
        fetchUserData(currentUser.id);
      }
    });
  }, [navigate]);

  const fetchUserData = async (uid: string) => {
    const { data } = await supabase.from('users').select('*').eq('uid', uid).single();
    if (data) {
      setUserData(data);
    } else {
      // If no user data found, it means it's a new signup (e.g. Google)
      // We need to show the "Complete Profile" form
      setAuthMode('signup');
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('verification-docs')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/profile'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMode === 'signup') {
        // Age verification
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 18) {
          throw new Error("Vous devez avoir au moins 18 ans pour vous inscrire.");
        }

        if (!idPhotoFront) {
          throw new Error("La photo de la pièce d'identité est requise.");
        }

        if (idType !== 'passport' && !idPhotoBack) {
          throw new Error("Le verso de la pièce d'identité est requis.");
        }

        let currentUserId = user?.id;
        let currentEmail = user?.email || email;

        if (!user) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error("Erreur lors de l'inscription.");
          
          currentUserId = authData.user.id;
          currentEmail = authData.user.email!;
        }

        // Upload photos
        const frontUrl = await uploadFile(idPhotoFront, currentUserId!);
        let backUrl = null;
        if (idPhotoBack) {
          backUrl = await uploadFile(idPhotoBack, currentUserId!);
        }

        // Create user profile in 'users' table
        const { error: profileError } = await supabase.from('users').insert({
          uid: currentUserId,
          email: currentEmail,
          displayName: fullName,
          phoneNumber: phone,
          dateOfBirth: dob,
          idType,
          idNumber,
          idPhotoFront: frontUrl,
          idPhotoBack: backUrl,
          role: 'client',
          status: 'pending_verification',
          balance: 0
        });

        if (profileError) throw profileError;
        
        // Redirect to OTP verification if not already verified
        const isVerified = sessionStorage.getItem('otp_verified') === 'true';
        if (!isVerified) {
          navigate('/otp', { state: { email: currentEmail, userId: currentUserId } });
        } else {
          fetchUserData(currentUserId!);
        }
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) throw authError;

        if (authData.user) {
          // Redirect to OTP verification
          navigate('/otp', { state: { email, userId: authData.user.id } });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
  };

  if (user && userData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-primary dark:bg-black"></div>
              <div className="relative pt-8">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto border-4 border-white shadow-xl dark:bg-dark-surface dark:border-dark-border">
                  <UserIcon size={48} className="text-primary dark:text-secondary" />
                </div>
                <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                  {userData.displayName}
                </h2>
                <p className="text-slate-400 text-sm font-medium">{userData.email}</p>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-widest dark:bg-secondary/5 dark:text-secondary">
                    <ShieldCheck size={14} /> {t(`role_${userData.role}`)}
                  </div>
                  {userData.status === 'pending_verification' && (
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest dark:bg-amber-500/10 dark:text-amber-500">
                      <AlertCircle size={14} /> En attente de vérification
                    </div>
                  )}
                  {userData.status === 'rejected' && (
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-accent/5 text-accent rounded-full text-[10px] font-black uppercase tracking-widest dark:bg-accent/10 dark:text-accent">
                      <X size={14} /> Vérification rejetée
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-dark-border">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Solde</div>
                  <div className="text-xl font-black text-primary dark:text-secondary">{userData.balance?.toLocaleString()} HTG</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Points</div>
                  <div className="text-xl font-black text-accent">0 PTS</div>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <button className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                  <PlusCircle size={18} /> {t('deposit')}
                </button>
                <button onClick={handleLogout} className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2 dark:bg-dark-bg dark:text-slate-400 dark:hover:bg-dark-border">
                  <LogOut size={18} /> {t('logout')}
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Settings size={18} className="text-primary dark:text-secondary" /> Paramètres
              </h3>
              <ul className="space-y-4">
                <li>
                  <button className="w-full flex items-center justify-between text-sm font-bold text-slate-600 hover:text-primary transition-all dark:text-slate-400 dark:hover:text-secondary">
                    <div className="flex items-center gap-3"><Edit2 size={18} /> Modifier le profil</div>
                    <ChevronRight size={16} />
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center justify-between text-sm font-bold text-slate-600 hover:text-primary transition-all dark:text-slate-400 dark:hover:text-secondary">
                    <div className="flex items-center gap-3"><Lock size={18} /> Sécurité & Mot de passe</div>
                    <ChevronRight size={16} />
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center justify-between text-sm font-bold text-slate-600 hover:text-primary transition-all dark:text-slate-400 dark:hover:text-secondary">
                    <div className="flex items-center gap-3"><Smartphone size={18} /> Notifications</div>
                    <ChevronRight size={16} />
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="card">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter flex items-center gap-3">
                  <History /> {t('transaction_history')}
                </h2>
                <Link to="/buy" className="text-xs font-black text-accent uppercase tracking-widest hover:underline">
                  Nouvel Achat
                </Link>
              </div>

              <div className="space-y-4">
                {/* Mock transactions for now */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 dark:bg-dark-bg dark:border-dark-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center dark:bg-green-500/10">
                      <ArrowUpCircle size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Dépôt MonCash</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">12 Mars 2026 • 14:30</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-green-600">+ 2,500 HTG</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Réussi</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 dark:bg-dark-bg dark:border-dark-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center dark:bg-blue-500/10">
                      <Ticket size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Achat Billet New York</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">10 Mars 2026 • 09:15</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-white">- 150 HTG</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Billet #NY-882</div>
                  </div>
                </div>

                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm font-medium italic">Plus de transactions seront affichées ici.</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-2xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                <Star /> Mes Billets Actifs
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 relative overflow-hidden dark:bg-secondary/5 dark:border-secondary/10">
                  <div className="absolute top-0 right-0 p-2 bg-primary text-white text-[8px] font-black uppercase dark:bg-secondary dark:text-primary">New York</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">ID: #NY-882</div>
                  <div className="flex gap-2 mb-6">
                    {['12', '45', '88'].map(n => (
                      <div key={n} className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-primary shadow-sm dark:bg-dark-bg dark:text-secondary">{n}</div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mise</div>
                      <div className="text-lg font-black text-primary dark:text-secondary">150 HTG</div>
                    </div>
                    <div className="text-[10px] font-black text-green-500 uppercase tracking-widest">En attente</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl p-8 dark:border-dark-border">
                  <Link to="/buy" className="text-slate-400 hover:text-primary transition-all flex flex-col items-center gap-2">
                    <PlusCircle size={32} />
                    <span className="text-xs font-black uppercase tracking-widest">Nouveau Billet</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-slate-50 dark:bg-dark-bg">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <div className="inline-block mb-6">
            <Logo className="w-24 h-24" />
          </div>
          <h1 className="text-4xl font-black text-primary dark:text-secondary tracking-tighter uppercase italic leading-none mb-2">
            {user && !userData ? "Compléter profil" : (authMode === 'login' ? t('login') : t('signup'))}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {user && !userData 
              ? "Veuillez fournir vos informations pour finaliser votre inscription."
              : (authMode === 'login' ? "Bon retour parmi nous !" : "Rejoignez la communauté Jonas Loto.")}
          </p>
        </div>

        <div className="card p-8 md:p-10">
          <form onSubmit={handleAuth} className="space-y-6">
            {authMode === 'signup' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('full_name')}</label>
                  <div className="relative">
                    <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Jean Dupont"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('phone')}</label>
                  <div className="relative">
                    <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="tel" 
                      placeholder="1234 5678 (Code pays optionnel)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date de Naissance</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="date" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de Pièce</label>
                  <select 
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as any)}
                    className="input-field"
                    required
                  >
                    <option value="cin">Carte d'Identification Nationale (CIN)</option>
                    <option value="license">Permis de Conduire</option>
                    <option value="passport">Passeport</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {idType === 'passport' ? 'Numéro de Passeport' : idType === 'license' ? 'NIF' : 'CIN'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="Numéro de la pièce"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {idType === 'passport' ? 'Photo de la première page' : 'Photo Recto'}
                    </label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setIdPhotoFront(e.target.files?.[0] || null)}
                      className="input-field py-2 text-xs"
                      required
                    />
                  </div>
                  {idType !== 'passport' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Photo Verso</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setIdPhotoBack(e.target.files?.[0] || null)}
                        className="input-field py-2 text-xs"
                        required
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {!user && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('email')}</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="email" 
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('password')}</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl flex items-center gap-3 text-accent text-xs font-bold">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {user && !userData ? <CheckCircle2 size={20} /> : (authMode === 'login' ? <LogOut size={20} className="rotate-180" /> : <UserIcon size={20} />)}
                  {user && !userData ? "Finaliser l'inscription" : (authMode === 'login' ? t('login') : t('signup'))}
                </>
              )}
            </button>
          </form>

          {!user && (
            <>
              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-dark-border"></div></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-300 dark:bg-dark-surface">Ou</span></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3 dark:border-dark-border dark:text-slate-400 dark:hover:bg-dark-bg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuer avec Google
              </button>
            </>
          )}

          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="w-full py-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 dark:border-dark-border dark:text-slate-400 dark:hover:bg-dark-bg"
          >
            {authMode === 'login' ? t('signup') : t('login')}
          </button>
          
          <p className="text-center mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            {t('any_email_hint')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
