import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { handleSupabaseError, OperationType } from '../lib/supabaseUtils';
import { motion } from 'motion/react';
import { 
  Users, Ticket, MapPin, ShieldCheck, Activity,
  AlertTriangle, Search, Filter
} from 'lucide-react';

export default function Supervisor() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('agents');
  const [agents, setAgents] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: agentsData } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'agent')
          .limit(10);
        
        if (agentsData) setAgents(agentsData || []);

        const { data: ticketsData } = await supabase
          .from('tickets')
          .select('*')
          .order('createdAt', { ascending: false })
          .limit(10);
        
        if (ticketsData) setRecentTickets(ticketsData || []);
      } catch (err) {
        console.error('Error fetching supervisor data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time listeners
    const agentsChannel = supabase
      .channel('supervisor-agents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchData();
      })
      .subscribe();

    const ticketsChannel = supabase
      .channel('supervisor-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(agentsChannel);
      supabase.removeChannel(ticketsChannel);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Supervision & Contrôle</h1>
          <p className="text-gray-500">Surveillance en temps réel des activités de Jonas Loto</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          {[
            { id: 'agents', label: 'Agents', icon: Users },
            { id: 'tickets', label: 'Billets', icon: Ticket },
            { id: 'branches', label: 'Succursales', icon: MapPin }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Agents Actifs</div>
            <div className="text-2xl font-black text-gray-900">{agents.length}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            <Ticket size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ventes (Heure)</div>
            <div className="text-2xl font-black text-gray-900">{recentTickets.length}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Alertes</div>
            <div className="text-2xl font-black text-gray-900">0</div>
          </div>
        </div>
      </div>

      {activeTab === 'agents' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <div className="relative w-96">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher un agent..."
                className="w-full pl-12 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <button className="flex items-center gap-2 text-gray-400 font-bold text-sm hover:text-gray-600">
              <Filter size={18} /> Filtres
            </button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Succursale</th>
                <th className="px-6 py-4">Ventes Jour</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold uppercase">
                        {agent.displayName?.substring(0, 2) || 'AG'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{agent.displayName || 'Agent'}</div>
                        <div className="text-[10px] text-gray-400">{agent.phoneNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">Pétion-Ville #1</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">4,250 HTG</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      En ligne
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary font-bold text-xs hover:underline">Détails</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h3 className="font-black text-gray-900">Flux de Billets en Temps Réel</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTickets.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                Aucun billet trouvé
              </div>
            ) : (
              recentTickets.map(ticket => (
                <div key={ticket.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center">
                      <Ticket size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{ticket.borlette || 'Tirage'}</div>
                      <div className="text-[10px] text-gray-400">ID: {ticket.id.substring(0, 8)}...</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-gray-900">{ticket.amount} HTG</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">En attente</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
