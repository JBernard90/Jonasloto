import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  History, Calendar, Star, Search, 
  Filter, ChevronRight, ArrowRight, TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Results() {
  const { t } = useTranslation();
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        let query = supabase
          .from('draws')
          .select('*')
          .order('drawDate', { ascending: false });
        
        if (filter !== 'all') {
          query = query.eq('type', filter);
        }
  
        const { data, error } = await query;
        if (error) throw error;
        if (data) setDraws(data);
      } catch (err) {
        console.error('Jonas Loto Center: Error fetching draws in Results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDraws().catch(err => console.error('Jonas Loto Center: Error in fetchDraws in Results:', err));

    let channel: any;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('results_updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'draws' }, (payload) => {
          setDraws(prev => [payload.new, ...prev]);
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Jonas Loto Center: Results channel subscription error - check your Supabase Realtime configuration and table publications');
          }
        });
    }

    return () => {
      if (channel) supabase.removeChannel(channel).catch(err => console.error('Jonas Loto Center: Error removing results channel:', err));
    };
  }, [filter]);

  const drawTypes = ['all', 'New York', 'Florida', 'Georgia'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter mb-2">
            {t('results')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Consultez tous les tirages passés et vérifiez vos gains.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {drawTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === type 
                  ? 'bg-primary text-white dark:bg-secondary dark:text-primary' 
                  : 'bg-white text-slate-500 border border-slate-100 hover:border-primary/20 dark:bg-dark-surface dark:border-dark-border dark:text-slate-400'
              }`}
            >
              {type === 'all' ? 'Tous les tirages' : type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="card animate-pulse h-32"></div>
          ))
        ) : draws.length > 0 ? (
          draws.map((draw, i) => (
            <motion.div
              key={draw.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="w-16 h-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center dark:bg-secondary/5 dark:text-secondary">
                  <Calendar size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded dark:bg-slate-800">
                      {draw.type}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {format(new Date(draw.drawDate), 'PPP', { locale: fr })}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                    Tirage #{draw.id.slice(0, 8)}
                  </h3>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                {draw.winningNumbers && Object.values(draw.winningNumbers).map((num: any, idx: number) => (
                  <div key={idx} className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-slate-900/20 group-hover:bg-primary transition-colors dark:bg-slate-800 dark:group-hover:bg-secondary dark:group-hover:text-primary">
                    {num}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-6 md:pt-0 border-slate-100 dark:border-dark-border">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jackpot Gagné</div>
                  <div className="text-2xl font-black text-accent">{draw.jackpot?.toLocaleString()} HTG</div>
                </div>
                <div className="flex items-center gap-2 text-green-500 font-bold text-xs uppercase">
                  <CheckCircle2 size={20} /> {draw.status}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200 dark:bg-dark-surface dark:border-dark-border">
            <History size={64} className="mx-auto text-slate-200 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Aucun résultat trouvé</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Essayez de changer vos filtres ou revenez plus tard.</p>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
        <div className="card bg-primary text-white dark:bg-black border-none">
          <TrendingUp className="text-secondary mb-4" size={32} />
          <h4 className="text-xl font-black uppercase italic mb-2">Total Distribué</h4>
          <div className="text-4xl font-black text-secondary tracking-tighter">12,450,000 HTG</div>
          <p className="text-slate-400 text-xs mt-4">Depuis le début de l'année 2026.</p>
        </div>
        <div className="card">
          <Star className="text-accent mb-4" size={32} />
          <h4 className="text-xl font-black uppercase italic mb-2 dark:text-white">Gagnants du jour</h4>
          <div className="text-4xl font-black text-primary dark:text-secondary tracking-tighter">1,245</div>
          <p className="text-slate-400 text-xs mt-4">Joueurs ayant remporté un gain aujourd'hui.</p>
        </div>
        <div className="card">
          <Star className="text-primary dark:text-secondary mb-4" size={32} />
          <h4 className="text-xl font-black uppercase italic mb-2 dark:text-white">Prochain Tirage</h4>
          <div className="text-4xl font-black text-accent tracking-tighter">18:30</div>
          <p className="text-slate-400 text-xs mt-4">Tirage New York Soir.</p>
        </div>
      </div>
    </div>
  );
}
