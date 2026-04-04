import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  History, 
  Star, 
  Smartphone, 
  LogOut,
  ChevronRight,
  Ticket,
  Wallet,
  PlusCircle,
  ArrowUpCircle,
  Calendar,
  Edit2,
  Save,
  X,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInYears, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import Logo from '../components/Logo';

interface ProfileProps {
  user: User | null;
}

interface TicketData {
  id: string;
  borlette: string;
  lotos: string[];
  entries: Record<string, { numbers: string[], amounts: number[] }>;
  amount: number;
  status: string;
  createdAt: string;
}

export default function Profile({ user }: ProfileProps) {
  const { t, i18n } = useTranslation();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [idType, setIdType] = useState('CIN');
  const [idNumber, setIdNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [topUpAmount, setTopUpAmount] = useState(500);
  const [topUpMethod, setTopUpMethod] = useState('MonCash');

  useEffect(() => {
    if (!user) return;

    // Fetch user profile data
    const fetchProfile = async () => {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('uid', user.id)
          .single();

        if (userData) {
          setUserData(userData);
          setFullName(userData.displayName || '');
          setPhoneNumber(userData.phoneNumber || '');
          setDateOfBirth(userData.dateOfBirth || '');
          setIdType(userData.idType || 'CIN');
          setIdNumber(userData.idNumber || '');
        } else {
          // Create profile if not exists (e.g. after Google login)
          const newProfile = {
            uid: user.id,
            email: user.email || '',
            displayName: user.user_metadata?.full_name || 'Joueur',
            phoneNumber: '',
            dateOfBirth: '',
            idType: 'CIN',
            idNumber: '',
            role: selectedRole,
            loyaltyPoints: 0,
            balance: 0,
            createdAt: new Date().toISOString()
          };
          const { data: createdUser } = await supabase
            .from('users')
            .insert([newProfile])
            .select()
            .single();
          
          if (createdUser) {
            setUserData(createdUser);
            setFullName(createdUser.displayName);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();

    // Fetch ticket history (without Realtime)
    const fetchTickets = async () => {
      try {
        const { data: ticketList } = await supabase
          .from('tickets')
          .select('*')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false });
        
        if (ticketList) {
          setTickets(ticketList);
        }
      } catch (err) {
        console.error('Error fetching tickets:', err);
      }
    };
    fetchTickets();
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (authMode === 'signup') {
      if (dateOfBirth) {
        const age = differenceInYears(new Date(), new Date(dateOfBirth));
        if (age < 18) {
          setError(t('age_error') || 'You must be 18 or older');
          setLoading(false);
          return;
        }
      }
    }

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data: res, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phoneNumber
            }
          }
        });
        if (signUpError) throw signUpError;
        
        if (res.user) {
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              uid: res.user.id,
              email,
              displayName: fullName,
              phoneNumber,
              dateOfBirth,
              idType,
              idNumber,
              role: selectedRole,
              loyaltyPoints: 0,
              balance: 0,
              createdAt: new Date().toISOString()
            }]);
          if (insertError) throw insertError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const updatedData = {
        displayName: fullName,
        phoneNumber,
        dateOfBirth,
        idType,
        idNumber
      };
      const { error } = await supabase
        .from('users')
        .update(updatedData)
        .eq('uid', user.id);
      
      if (error) throw error;
      
      setUserData({ ...userData, ...updatedData });
      setIsEditing(false);
    } catch (error) {
      console.error("Update profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!user || !userData) return;
    setLoading(true);
    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: topUpMethod, amount: topUpAmount, phoneNumber: userData.phoneNumber || phoneNumber })
      });
      const data = await response.json();

      if (data.success) {
        const newBalance = (userData.balance || 0) + topUpAmount;
        const { error } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('uid', user.id);
        
        if (error) throw error;
        
        setUserData({ ...userData, balance: newBalance });
        alert(t('top_up_success') || 'Top up successful');
      }
    } catch (error) {
      console.error("Top up error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/profile'
      }
    });
    if (error) console.error("Google login error:", error);
  };

  const handleSuspendSelf = async () => {
    if (!user) return;
    if (!window.confirm(t('confirm_suspend_self') || 'Are you sure?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'suspended' })
        .eq('uid', user.id);
      
      if (error) throw error;
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Suspend self error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelf = async () => {
    if (!user) return;
    if (!window.confirm(t('confirm_delete_self') || 'Are you sure?')) return;
    
    setLoading(true);
    try {
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('uid', user.id);
      
      if (dbError) throw dbError;
      
      await supabase.auth.signOut();
      alert("Votre compte a été supprimé de notre base de données.");
    } catch (error) {
      console.error("Delete self error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateLocale = () => i18n.language === 'fr' ? fr : enUS;

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100"
        >
          <div className="text-center mb-8">
            <div className="mb-6">
              <Logo className="mx-auto" />
            </div>
            <h1 className="text-3xl font-black tracking-tight uppercase italic">
              <span className="text-primary">{authMode === 'login' ? 'Connexion' : 'Inscription'}</span>
            </h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">
              {authMode === 'login' ? t('login_email') : t('signup_email')}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
              Je suis un :
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'client', icon: UserIcon },
                { id: 'agent', icon: Smartphone },
                { id: 'supervisor', icon: ShieldCheck },
                { id: 'admin', icon: Lock }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 transition-all text-[10px] font-bold uppercase tracking-wider ${
                    selectedRole === r.id 
                      ? 'border-primary bg-primary text-white shadow-md' 
                      : 'border-gray-100 bg-white text-gray-400 hover:border-primary/20'
                  }`}
                >
                  <r.icon size={14} />
                  {t(`role_${r.id}`) || r.id}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder={t('full_name') || 'Full Name'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                    required
                  />
                </div>
                <div className="relative">
                  <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="tel" 
                    placeholder={t('phone') || 'Phone'}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                    required
                  />
                </div>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="date" 
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                    required
                    title={t('dob') || 'Date of Birth'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select 
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium appearance-none"
                      required
                    >
                      <option value="CIN">{t('cin') || 'CIN'}</option>
                      <option value="NIF">{t('nif') || 'NIF'}</option>
                      <option value="Passport">{t('passport') || 'Passport'}</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder={t('id_number') || 'ID Number'}
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                    required
                  />
                </div>
              </>
            )}
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="email" 
                placeholder={t('email') || 'Email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                required
              />
            </div>
            <p className="text-[10px] text-gray-400 italic ml-1">{t('any_email_hint') || 'Any email works'}</p>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="password" 
                placeholder={t('password') || 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95"
            >
              {loading ? '...' : (authMode === 'login' ? t('login') || 'Login' : t('signup') || 'Sign Up')}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-white px-2 text-gray-300 tracking-widest">Ou</span></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-3 shadow-sm"
          >
            <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" className="w-5 h-5" alt="Google" />
            {t('login_google') || 'Login with Google'}
          </button>

          <p className="text-center mt-8 text-sm text-gray-500">
            {authMode === 'login' ? t('no_account') : t('already_account')}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="ml-1 text-primary font-black hover:underline uppercase tracking-wider text-xs"
            >
              {authMode === 'login' ? t('signup') || 'Sign Up' : t('login') || 'Login'}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary transition-colors"
              title={t('edit_profile') || 'Edit Profile'}
            >
              <Edit2 size={20} />
            </button>
          )}

          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto border border-primary/20">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full rounded-3xl object-cover" />
              ) : (
                <UserIcon size={40} />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-secondary border-4 border-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
              <Star size={14} className="text-primary" />
            </div>
          </div>

          {userData?.role && (
            <div className="mb-4">
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                userData.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                userData.role === 'supervisor' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                userData.role === 'agent' ? 'bg-primary/5 text-primary border-primary/10' :
                'bg-gray-50 text-gray-500 border-gray-100'
              }`}>
                {t(`role_${userData.role}`) || userData.role}
              </span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('name') || 'Name'}</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('phone') || 'Phone'}</label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('id_type') || 'ID Type'}</label>
                  <select 
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  >
                    <option value="CIN">CIN</option>
                    <option value="NIF">NIF</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('id_number') || 'ID Number'}</label>
                  <input 
                    type="text" 
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <Save size={16} /> {t('save_changes') || 'Save'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-100 text-gray-600 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                >
                  <X size={16} /> {t('cancel') || 'Cancel'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">{userData?.displayName || user.user_metadata?.full_name || 'Joueur'}</h2>
              <p className="text-gray-400 text-sm mb-2">{user.email}</p>
              <p className="text-primary font-black text-xs uppercase tracking-widest mb-2">{userData?.phoneNumber || "Pas de téléphone"}</p>
              <div className="flex justify-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rôle:</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t(`role_${userData?.role || 'client'}`) || userData?.role || 'client'}</span>
              </div>
              {userData?.idNumber && (
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-6">
                  {userData.idType}: {userData.idNumber}
                </p>
              )}
              {(!userData?.dateOfBirth || !userData?.idNumber) && (
                <div className="bg-accent/5 text-accent p-3 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 border border-accent/10">
                  <AlertCircle size={14} />
                  Profil incomplet (Vérification d'âge requise)
                </div>
              )}
            </>
          )}
          
          <div className="grid grid-cols-2 gap-4 my-8">
            <div className="bg-secondary/10 p-4 rounded-2xl border border-secondary/20">
              <div className="text-[10px] text-secondary-dark font-black uppercase tracking-widest mb-1">Points</div>
              <div className="text-xl font-black text-primary">{userData?.loyaltyPoints || 0}</div>
            </div>
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <div className="text-[10px] text-primary/40 font-black uppercase tracking-widest mb-1">Rang</div>
              <div className="text-xl font-black text-primary">Bronze</div>
            </div>
          </div>

          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center justify-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest hover:bg-accent/5 py-3 rounded-xl transition-colors mb-4 border border-accent/10"
          >
            <LogOut size={18} /> {t('logout') || 'Logout'}
          </button>

          <div className="pt-6 border-t border-gray-100">
            <h4 className="text-[10px] font-black text-accent uppercase tracking-widest mb-4 text-left">{t('danger_zone') || 'Danger Zone'}</h4>
            <div className="space-y-2">
              <button 
                onClick={handleSuspendSelf}
                className="w-full flex items-center justify-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 py-2 rounded-lg transition-colors border border-primary/10"
              >
                <AlertCircle size={14} /> {t('suspend_my_account') || 'Suspend Account'}
              </button>
              <button 
                onClick={handleDeleteSelf}
                className="w-full flex items-center justify-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest hover:bg-accent/5 py-2 rounded-lg transition-colors border border-accent/10"
              >
                <X size={14} /> {t('delete_my_account') || 'Delete Account'}
              </button>
            </div>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="text-primary" />
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">{t('wallet') || 'Wallet'}</h3>
          </div>
          
          <div className="bg-primary text-white p-6 rounded-2xl mb-6 border-b-4 border-secondary shadow-lg">
            <div className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">{t('balance') || 'Balance'}</div>
            <div className="text-3xl font-black text-secondary">{userData?.balance?.toLocaleString() || 0} HTG</div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              {[100, 500, 1000].map(amt => (
                <button 
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`flex-1 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                    topUpAmount === amt ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-300'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
            
            <select 
              value={topUpMethod}
              onChange={(e) => setTopUpMethod(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-bold text-xs uppercase tracking-widest"
            >
              <option value="MonCash">MonCash (Digicel)</option>
              <option value="NatCash">NatCash (Natcom)</option>
              <option value="Lajan Cash">Lajan Cash</option>
            </select>

            <button 
              onClick={handleTopUp}
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ArrowUpCircle size={18} />}
              {t('top_up') || 'Top Up'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-6">
            <History className="text-primary" />
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">{t('history') || 'History'}</h2>
          </div>

          {tickets.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-gray-200">
              <Ticket size={48} className="mx-auto text-gray-200 mb-4" />
              <h3 className="text-xl font-black text-gray-900 uppercase italic">Aucun billet acheté</h3>
              <p className="text-gray-400 text-sm mb-6">Tentez votre chance aujourd'hui !</p>
              <Link to="/buy" className="bg-primary text-white px-8 py-3 rounded-full font-black uppercase tracking-widest hover:bg-primary-dark transition-all inline-block shadow-lg shadow-primary/20">
                Acheter mon premier billet
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary border border-primary/10">
                      <Ticket size={24} />
                    </div>
                    <div>
                      <div className="text-lg font-black text-gray-900 uppercase italic">{ticket.borlette}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {ticket.createdAt ? format(parseISO(ticket.createdAt), 'PPP', { locale: getDateLocale() }) : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-grow max-w-md">
                    {Object.entries(ticket.entries || {}).map(([loto, entry]: [string, any]) => (
                      <div key={loto} className="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-black text-primary uppercase w-full">{loto}</span>
                        {entry.numbers.map((num: string, i: number) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] border border-secondary/20 shadow-sm">{num}</span>
                            <span className="text-[10px] font-bold text-gray-400">{entry.amounts[i]} HTG</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-black text-gray-900">{ticket.amount} HTG</div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${
                        ticket.status === 'won' ? 'text-green-500' : 
                        ticket.status === 'lost' ? 'text-accent' : 'text-primary'
                      }`}>
                        {ticket.status}
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
