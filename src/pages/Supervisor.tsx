import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Users, History, TrendingUp, 
  Settings, AlertCircle, CheckCircle2, 
  ArrowUpCircle, ArrowDownCircle, Search,
  Filter, PlusCircle, Trash2, Edit2,
  LayoutDashboard, Star, Ticket, DollarSign,
  UserCheck, UserX, UserMinus, Shield
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Supervisor() {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'agents' | 'earnings'>('agents');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({
    displayName: '',
    email: '',
    status: 'active'
  });
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalSales: 0,
    activeAgents: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: agentsList, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'agent')
          .order('createdAt', { ascending: false });
        
        if (error) throw error;
        if (agentsList) {
          setAgents(agentsList);
          setStats({
            totalAgents: agentsList.length,
            totalSales: agentsList.reduce((sum, a) => sum + (a.balance || 0), 0),
            activeAgents: agentsList.filter(a => a.status === 'active').length
          });
        }

        const { data: ticketsList, error: ticketsError } = await supabase
          .from('tickets')
          .select('*, agent:users!agentId(displayName, email)')
          .not('agentId', 'is', null)
          .order('created_at', { ascending: false });

        if (ticketsError) throw ticketsError;
        if (ticketsList) setEarnings(ticketsList);
      } catch (err) {
        console.error('Jonas Loto Center: Supervisor fetchData error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch(err => console.error('Jonas Loto Center: Supervisor unhandled fetchData error:', err));

    let channel: any;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('supervisor_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          fetchData().catch(err => console.error('Jonas Loto Center: Supervisor realtime users fetchData error:', err));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
          fetchData().catch(err => console.error('Jonas Loto Center: Supervisor realtime tickets fetchData error:', err));
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Jonas Loto Center: Supervisor updates channel subscription error - check your Supabase Realtime configuration and table publications');
          }
        });
    }

    return () => {
      if (channel) supabase.removeChannel(channel).catch(err => console.error('Jonas Loto Center: Error removing supervisor channel:', err));
    };
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('users').insert([{
        ...newAgent,
        role: 'agent',
        balance: 0,
        createdAt: new Date().toISOString()
      }]);
      if (error) throw error;
      setIsAgentModalOpen(false);
      setNewAgent({ displayName: '', email: '', status: 'active' });
      // fetchData() will be called by the realtime listener
    } catch (err) {
      console.error('Jonas Loto Center: Error creating agent:', err);
    }
  };

  const handleDeleteAgent = async (uid: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) return;
    try {
      const { error } = await supabase.from('users').delete().eq('uid', uid);
      if (error) throw error;
      setAgents(prev => prev.filter(a => a.uid !== uid));
    } catch (err) {
      console.error('Jonas Loto Center: Error deleting agent:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter mb-2">
            {t('supervisor')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Supervisez vos agents et suivez leurs performances en temps réel.</p>
        </div>

        <div className="flex gap-4">
          <div className="flex bg-white dark:bg-dark-surface p-1 rounded-xl border border-slate-100 dark:border-dark-border">
            <button
              onClick={() => {
                setActiveTab('agents');
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'agents'
                  ? 'bg-primary text-white dark:bg-secondary dark:text-primary'
                  : 'text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-secondary'
              }`}
            >
              Agents
            </button>
            <button
              onClick={() => {
                setActiveTab('earnings');
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'earnings'
                  ? 'bg-primary text-white dark:bg-secondary dark:text-primary'
                  : 'text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-secondary'
              }`}
            >
              Gains
            </button>
          </div>
          <button 
            onClick={() => setIsAgentModalOpen(true)}
            className="btn-primary py-2 px-6 text-xs flex items-center gap-2"
          >
            <PlusCircle size={16} /> Ajouter un Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card bg-primary text-white dark:bg-black border-none">
          <Users className="text-secondary mb-4" size={32} />
          <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">Total Agents</h4>
          <div className="text-4xl font-black text-white tracking-tighter">{stats.totalAgents}</div>
        </div>
        <div className="card">
          <DollarSign className="text-primary dark:text-secondary mb-4" size={32} />
          <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">Ventes Agents</h4>
          <div className="text-4xl font-black text-primary dark:text-secondary tracking-tighter">{stats.totalSales.toLocaleString()} HTG</div>
        </div>
        <div className="card">
          <TrendingUp className="text-accent mb-4" size={32} />
          <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">Gains Totaux</h4>
          <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            {earnings.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()} HTG
          </div>
        </div>
      </div>

      {activeTab === 'agents' ? (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-8 p-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
              <Shield className="text-primary dark:text-secondary" /> Liste des Agents
            </h3>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher un agent..." 
                className="input-field pl-12 py-2 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-bg text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 dark:border-dark-border">
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-6 py-4">Ventes</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Date d'inscription</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {agents
                  .filter(a => 
                    a.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    a.email?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(agent => (
                  <tr key={agent.uid} className="hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/5 text-primary rounded-lg flex items-center justify-center font-black text-xs dark:bg-secondary/5 dark:text-secondary">
                          {agent.displayName?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{agent.displayName}</div>
                          <div className="text-[10px] text-slate-400">{agent.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">{agent.balance?.toLocaleString()} HTG</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${agent.status === 'active' ? 'text-green-500' : 'text-accent'}`}>
                        {agent.status === 'active' ? <UserCheck size={12} /> : <UserX size={12} />} {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{format(new Date(agent.createdAt), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                        <button 
                          onClick={() => handleDeleteAgent(agent.uid)}
                          className="p-2 text-slate-400 hover:text-accent transition-colors"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {agents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic text-sm">
                      Aucun agent sous votre supervision.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 p-6 gap-4">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
              <History className="text-primary dark:text-secondary" /> Historique des Gains
            </h3>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher par agent ou ticket..." 
                  className="input-field pl-12 py-2 text-xs w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="input-field py-2 text-xs min-w-[150px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="won">Gagné</option>
                <option value="lost">Perdu</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-bg text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 dark:border-dark-border">
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-6 py-4">Ticket ID</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {earnings
                  .filter(e => {
                    const matchesSearch = 
                      e.agent?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      e.id.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
                    return matchesSearch && matchesStatus;
                  })
                  .map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{ticket.agent?.displayName || 'Inconnu'}</div>
                      <div className="text-[10px] text-slate-400">{ticket.agent?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-slate-500">#{ticket.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-primary dark:text-secondary">{ticket.amount?.toLocaleString()} HTG</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        ticket.status === 'won' ? 'bg-green-50 text-green-600 dark:bg-green-500/10' :
                        ticket.status === 'active' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' :
                        'bg-slate-100 text-slate-400 dark:bg-dark-surface'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
                {earnings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic text-sm">
                      Aucun historique de gains disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-surface rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Ajouter un Agent</h3>
              <button onClick={() => setIsAgentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-dark-bg">
                <PlusCircle className="rotate-45 text-slate-400" size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom Complet</label>
                <input 
                  type="text"
                  placeholder="Jean Dupont"
                  className="input-field"
                  value={newAgent.displayName}
                  onChange={(e) => setNewAgent({...newAgent, displayName: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input 
                  type="email"
                  placeholder="agent@jonasloto.com"
                  className="input-field"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({...newAgent, email: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Statut Initial</label>
                <select 
                  className="input-field"
                  value={newAgent.status}
                  onChange={(e) => setNewAgent({...newAgent, status: e.target.value})}
                  required
                >
                  <option value="active">Actif</option>
                  <option value="pending">En attente</option>
                </select>
              </div>

              <button type="submit" className="w-full btn-primary py-4 mt-4">
                Créer le compte Agent
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
