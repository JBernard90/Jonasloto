import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { handleSupabaseError, OperationType } from '../lib/supabaseUtils';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Users, 
  Trophy, 
  DollarSign, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  ShieldCheck,
  UserX,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LOTTERY_CONFIG } from '../constants/lottery';
import Logo from '../components/Logo';

export default function Admin() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalSales: 1250000,
    activeUsers: 4500,
    payouts: 850000,
    growth: 12.5
  });

  // Draw Form State
  const [drawType, setDrawType] = useState('New York');
  const [drawDate, setDrawDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [drawTime, setDrawTime] = useState(format(new Date(), 'HH:mm'));
  const [drawNumbers, setDrawNumbers] = useState(['', '', '']);
  const [drawJackpot, setDrawJackpot] = useState(100000);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'users') return;
    
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(50);
      
      if (error) {
        handleSupabaseError(error, OperationType.LIST, 'users');
      } else {
        setUsers(data || []);
      }
    };

    fetchUsers();

    const channel = supabase
      .channel('admin-users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('uid', userId);
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('uid', userId);
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(t('confirm_delete_user'))) return;
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('uid', userId);
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  const drawTypes = Object.keys(LOTTERY_CONFIG);

  const handleAddDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dateTime = new Date(`${drawDate}T${drawTime}`);
      const { error } = await supabase.from('draws').insert({
        type: drawType,
        date: dateTime.toISOString(),
        numbers: drawNumbers.filter(n => n !== ''),
        jackpot: Number(drawJackpot),
        status: 'completed',
        createdAt: new Date().toISOString()
      });
      if (error) throw error;
      alert("Tirage ajouté avec succès !");
      setDrawNumbers(['', '', '']);
    } catch (error) {
      handleSupabaseError(error, OperationType.CREATE, 'draws');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo size={48} />
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Tableau de Bord Admin</h1>
            <p className="text-gray-500">Gestion centrale de Jonas Loto</p>
          </div>
        </div>

        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          {['dashboard', 'draws', 'users', 'transactions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-secondary/20 text-secondary-dark rounded-2xl flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
                <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                  <ArrowUpRight size={14} /> {stats.growth}%
                </div>
              </div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Ventes Totales</div>
              <div className="text-2xl font-black text-gray-900">{stats.totalSales.toLocaleString()} HTG</div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                  <ArrowUpRight size={14} /> 4.2%
                </div>
              </div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Joueurs Actifs</div>
              <div className="text-2xl font-black text-gray-900">{stats.activeUsers.toLocaleString()}</div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                  <Trophy size={24} />
                </div>
                <div className="flex items-center gap-1 text-red-500 text-xs font-bold">
                  <ArrowDownRight size={14} /> 2.1%
                </div>
              </div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Gains Payés</div>
              <div className="text-2xl font-black text-gray-900">{stats.payouts.toLocaleString()} HTG</div>
            </div>

            <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/50">
                  <TrendingUp size={24} />
                </div>
              </div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Performance</div>
              <div className="text-2xl font-black">Excellent</div>
              <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-3/4"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <BarChart3 className="text-primary" /> Ventes par Période
              </h3>
              <div className="h-64 flex items-end gap-4">
                {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-primary/10 hover:bg-primary transition-all rounded-t-xl cursor-pointer"
                      style={{ height: `${h}%` }}
                    ></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Jour {i+1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-black mb-6">Dernières Actions</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Tirage NY Ajouté</div>
                      <div className="text-[10px] text-gray-400">Il y a 2 heures</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'draws' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <Plus className="text-primary" /> Nouveau Tirage
              </h3>
              <form onSubmit={handleAddDraw} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Type de Tirage</label>
                  <select 
                    value={drawType}
                    onChange={(e) => setDrawType(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                  >
                    {drawTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                    <input 
                      type="date" 
                      value={drawDate}
                      onChange={(e) => setDrawDate(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Heure</label>
                    <input 
                      type="time" 
                      value={drawTime}
                      onChange={(e) => setDrawTime(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Numéros Gagnants</label>
                  <div className="flex gap-2">
                    {drawNumbers.map((num, i) => (
                      <input 
                        key={i}
                        type="text"
                        maxLength={2}
                        value={num}
                        onChange={(e) => {
                          const newNums = [...drawNumbers];
                          newNums[i] = e.target.value.replace(/\D/g, '');
                          setDrawNumbers(newNums);
                        }}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-center font-black focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="00"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Jackpot (HTG)</label>
                  <input 
                    type="number" 
                    value={drawJackpot}
                    onChange={(e) => setDrawJackpot(Number(e.target.value))}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-black"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Publier le Tirage'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-black text-gray-900">Derniers Tirages</h3>
                  <button className="text-primary font-bold text-xs hover:underline">Voir tout</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center font-bold">NY</div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">New York Evening</div>
                          <div className="text-[10px] text-gray-400">24 Mars 2026 • 19:30</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs">45</span>
                        <span className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs">12</span>
                        <span className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs">88</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-gray-900">250,000 HTG</div>
                        <div className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Validé</div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <div className="relative w-96">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher un utilisateur (nom, email, téléphone)..."
                className="w-full pl-12 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors flex items-center gap-2">
                <Plus size={18} /> Ajouter un Agent
              </button>
              <button className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
                <ShieldCheck size={18} /> Ajouter un Superviseur
              </button>
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Points</th>
                <th className="px-6 py-4">Date Inscription</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                        {user.displayName?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{user.displayName || 'Joueur'}</div>
                        <div className="text-[10px] text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role || 'client'}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-primary cursor-pointer ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 
                        user.role === 'supervisor' ? 'bg-blue-100 text-blue-600' :
                        user.role === 'agent' ? 'bg-primary/10 text-primary' :
                        'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <option value="client">{t('role_client')}</option>
                      <option value="agent">{t('role_agent')}</option>
                      <option value="supervisor">{t('role_supervisor')}</option>
                      <option value="admin">{t('role_admin')}</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {t(`status_${user.status || 'active'}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{user.loyaltyPoints?.toLocaleString() || 0}</td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {user.createdAt ? format(parseISO(user.createdAt), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {user.status === 'suspended' ? (
                        <button 
                          onClick={() => handleUpdateStatus(user.id, 'active')}
                          className="text-green-500 hover:text-green-700 transition-colors p-2"
                          title={t('activate')}
                        >
                          <CheckCircle size={18} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateStatus(user.id, 'suspended')}
                          className="text-accent hover:text-accent-dark transition-colors p-2"
                          title={t('suspend')}
                        >
                          <UserX size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-2"
                        title={t('delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
