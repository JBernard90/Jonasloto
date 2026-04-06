import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Shield, Users, History, TrendingUp, 
  Settings, AlertCircle, CheckCircle2, 
  ArrowUpCircle, ArrowDownCircle, Search,
  Filter, PlusCircle, Trash2, Edit2,
  LayoutDashboard, Star, Ticket, DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

export default function Admin() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSales: 0,
    totalDraws: 0,
    activeTickets: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'draws' | 'verification'>('stats');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { data: ticketsData } = await supabase.from('tickets').select('amount');
      const { count: drawsCount } = await supabase.from('draws').select('*', { count: 'exact', head: true });
      const { count: activeTicketsCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'active');

      const totalSales = ticketsData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalSales,
        totalDraws: drawsCount || 0,
        activeTickets: activeTicketsCount || 0
      });

      const { data: usersList } = await supabase.from('users').select('*').order('createdAt', { ascending: false });
      const { data: drawsList } = await supabase.from('draws').select('*').order('date', { ascending: false }).limit(10);

      setUsers(usersList || []);
      setDraws(drawsList || []);
      setLoading(false);
    };

    fetchData();
// ... (rest of useEffect)
  }, []);

  const handleVerify = async (uid: string, status: 'active' | 'rejected') => {
    const { error } = await supabase.from('users').update({ status }).eq('uid', uid);
    if (!error) {
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status } : u));
      setSelectedUser(null);
    }
  };

  const chartData = [
// ... (chartData)
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter mb-2">
            {t('admin')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gérez les utilisateurs, les tirages et consultez les statistiques.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {['stats', 'users', 'draws', 'verification'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-primary text-white dark:bg-secondary dark:text-primary' 
                  : 'bg-white text-slate-500 border border-slate-100 hover:border-primary/20 dark:bg-dark-surface dark:border-dark-border dark:text-slate-400'
              }`}
            >
              {tab === 'stats' ? 'Statistiques' : tab === 'users' ? 'Utilisateurs' : tab === 'draws' ? 'Tirages' : 'Vérifications'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="card bg-primary text-white dark:bg-black border-none">
              <Users className="text-secondary mb-4" size={32} />
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">Total Utilisateurs</h4>
              <div className="text-4xl font-black text-white tracking-tighter">{stats.totalUsers}</div>
            </div>
            <div className="card">
              <DollarSign className="text-primary dark:text-secondary mb-4" size={32} />
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">Ventes Totales</h4>
              <div className="text-4xl font-black text-primary dark:text-secondary tracking-tighter">{stats.totalSales.toLocaleString()} HTG</div>
            </div>
            <div className="card">
              <History className="text-accent mb-4" size={32} />
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">Total Tirages</h4>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.totalDraws}</div>
            </div>
            <div className="card">
              <Ticket className="text-green-500 mb-4" size={32} />
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">Billets Actifs</h4>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.activeTickets}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card h-[400px]">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Ventes de la semaine</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="sales" fill="#003087" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card h-[400px]">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Activité Utilisateurs</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#FF4B2B" strokeWidth={3} dot={{ r: 4, fill: '#FF4B2B', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-8 p-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
              <Users className="text-primary dark:text-secondary" /> Liste des Utilisateurs
            </h3>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher..." className="input-field pl-12 py-2 text-xs" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-bg text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 dark:border-dark-border">
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Solde</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {users.map(user => (
                  <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/5 text-primary rounded-lg flex items-center justify-center font-black text-xs dark:bg-secondary/5 dark:text-secondary">
                          {user.displayName?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{user.displayName}</div>
                          <div className="text-[10px] text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest dark:bg-dark-surface dark:text-slate-400">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">{user.balance?.toLocaleString()} HTG</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 size={12} /> {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{format(new Date(user.createdAt), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                        <button className="p-2 text-slate-400 hover:text-accent transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-8 p-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
              <Shield className="text-primary dark:text-secondary" /> Vérifications en attente
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-bg text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 dark:border-dark-border">
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4">Pièce</th>
                  <th className="px-6 py-4">Numéro</th>
                  <th className="px-6 py-4">Date de Naissance</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {users.filter(u => u.status === 'pending_verification').map(user => (
                  <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{user.displayName}</div>
                      <div className="text-[10px] text-slate-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest dark:bg-dark-surface dark:text-slate-400">
                        {user.idType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{user.idNumber}</td>
                    <td className="px-6 py-4 text-sm">{user.dateOfBirth}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="btn-primary py-2 px-4 text-xs"
                      >
                        Vérifier
                      </button>
                    </td>
                  </tr>
                ))}
                {users.filter(u => u.status === 'pending_verification').length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      Aucune vérification en attente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-surface rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Vérification d'Identité</h3>
                <p className="text-sm text-slate-500">{selectedUser.displayName} ({selectedUser.email})</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-dark-bg">
                <PlusCircle className="rotate-45 text-slate-400" size={24} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informations</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Type de pièce:</span>
                      <span className="font-bold uppercase">{selectedUser.idType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Numéro:</span>
                      <span className="font-bold">{selectedUser.idNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Date de Naissance:</span>
                      <span className="font-bold">{selectedUser.dateOfBirth}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Recto / Page 1</p>
                    <img 
                      src={selectedUser.idPhotoFront} 
                      alt="ID Front" 
                      className="w-full rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {selectedUser.idPhotoBack && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Verso</p>
                      <img 
                        src={selectedUser.idPhotoBack} 
                        alt="ID Back" 
                        className="w-full rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-dark-bg flex gap-4">
              <button 
                onClick={() => handleVerify(selectedUser.uid, 'active')}
                className="flex-grow btn-primary py-4 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} /> Approuver
              </button>
              <button 
                onClick={() => handleVerify(selectedUser.uid, 'rejected')}
                className="flex-grow bg-accent text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
              >
                <AlertCircle size={20} /> Rejeter
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'draws' && (
// ... (draws content)
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-8 p-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
              <History className="text-primary dark:text-secondary" /> Gestion des Tirages
            </h3>
            <button className="btn-primary py-2 px-4 text-xs flex items-center gap-2">
              <PlusCircle size={16} /> Nouveau Tirage
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-bg text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 dark:border-dark-border">
                  <th className="px-6 py-4">Tirage</th>
                  <th className="px-6 py-4">Numéros</th>
                  <th className="px-6 py-4">Jackpot</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {draws.map(draw => (
                  <tr key={draw.id} className="hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest dark:bg-secondary/5 dark:text-secondary">
                        {draw.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {draw.numbers.map((n: string, i: number) => (
                          <span key={i} className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black dark:bg-slate-800">{n}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-accent">{draw.jackpot?.toLocaleString()} HTG</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 size={12} /> {draw.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{format(new Date(draw.date), 'dd/MM HH:mm')}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                        <button className="p-2 text-slate-400 hover:text-accent transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
