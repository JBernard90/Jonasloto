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
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Supervisor() {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalSales: 0,
    activeAgents: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: agentsList } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'agent')
        .order('createdAt', { ascending: false });
      
      if (agentsList) {
        setAgents(agentsList);
        setStats({
          totalAgents: agentsList.length,
          totalSales: agentsList.reduce((sum, a) => sum + (a.balance || 0), 0),
          activeAgents: agentsList.filter(a => a.status === 'active').length
        });
      }
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel('supervisor_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
          <button className="btn-primary py-2 px-6 text-xs flex items-center gap-2">
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
          <UserCheck className="text-green-500 mb-4" size={32} />
          <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">Agents Actifs</h4>
          <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.activeAgents}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-8 p-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
            <Shield className="text-primary dark:text-secondary" /> Liste des Agents
          </h3>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Rechercher un agent..." className="input-field pl-12 py-2 text-xs" />
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
              {agents.map(agent => (
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
                      <button className="p-2 text-slate-400 hover:text-accent transition-colors"><UserMinus size={16} /></button>
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
    </div>
  );
}
