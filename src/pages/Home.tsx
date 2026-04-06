import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Ticket, History, Shield, LayoutDashboard, 
  Settings, HelpCircle, Mail, Phone, MapPin, 
  Facebook, Twitter, Instagram, Youtube, Globe,
  Zap, ShieldCheck, Smartphone, TrendingUp,
  ChevronRight, ArrowRight, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Home() {
  const { t } = useTranslation();
  const [recentDraws, setRecentDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        const { data, error } = await supabase
          .from('draws')
          .select('*')
          .order('date', { ascending: false })
          .limit(3);
        
        if (error) throw error;
        if (data) setRecentDraws(data);
      } catch (err) {
        console.error('Jonas Loto Center: Error fetching draws in Home:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDraws();

    // Real-time listener for new draws
    const channel = supabase
      .channel('draws_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'draws' }, (payload) => {
        setRecentDraws(prev => [payload.new, ...prev].slice(0, 3));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const features = [
    { icon: ShieldCheck, title: t('secure_payments'), desc: "Transactions cryptées et sécurisées via Supabase." },
    { icon: Zap, title: t('realtime_updates'), desc: "Résultats et tirages mis à jour instantanément." },
    { icon: Smartphone, title: t('mobile_friendly'), desc: "Jouez n'importe où, n'importe quand sur votre mobile." },
    { icon: TrendingUp, title: "Jackpots Énormes", desc: "Des gains records chaque semaine pour nos joueurs." },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-primary dark:bg-black">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-10 w-72 h-72 bg-secondary rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 -right-10 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-secondary/20 text-secondary font-black text-xs uppercase tracking-widest mb-6 border border-secondary/20">
              #1 Loterie en Haïti
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none italic uppercase">
              {t('hero_title').split(',').map((part, i) => (
                <span key={i} className={i === 1 ? "text-secondary block" : "block"}>{part}</span>
              ))}
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-medium">
              {t('hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/buy-ticket" className="btn-secondary text-lg px-10 py-4 flex items-center justify-center gap-2">
                <Ticket size={24} /> {t('buy_ticket')}
              </Link>
              <Link to="/results" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                <History size={24} /> {t('results')}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Balls Animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[12, 45, 88, 23, 67].map((num, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.4, scale: 1 }}
              transition={{ delay: i * 0.2, duration: 1 }}
              className={`absolute w-12 h-12 md:w-20 md:h-20 bg-white/10 rounded-full flex items-center justify-center text-white font-black text-xl md:text-3xl border border-white/20 backdrop-blur-sm animate-float`}
              style={{
                top: `${20 + i * 15}%`,
                left: `${10 + i * 20}%`,
                animationDelay: `${i * 0.5}s`
              }}
            >
              {num}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Draws Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter mb-2">
              {t('recent_draws')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Consultez les derniers numéros gagnants en temps réel.</p>
          </div>
          <Link to="/results" className="hidden md:flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs hover:gap-4 transition-all dark:text-secondary">
            Voir tout <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse h-64"></div>
            ))
          ) : recentDraws.length > 0 ? (
            recentDraws.map((draw, i) => (
              <motion.div
                key={draw.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card group hover:border-primary/20 transition-all dark:hover:border-secondary/20"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="px-3 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest dark:bg-secondary/5 dark:text-secondary">
                    {draw.type}
                  </div>
                  <div className="text-xs font-bold text-slate-400">
                    {format(new Date(draw.date), 'PPP', { locale: fr })}
                  </div>
                </div>
                
                <div className="flex gap-3 justify-center mb-8">
                  {draw.numbers.map((num: string, idx: number) => (
                    <div key={idx} className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-slate-900/20 group-hover:bg-primary transition-colors dark:bg-slate-800 dark:group-hover:bg-secondary dark:group-hover:text-primary">
                      {num}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-dark-border">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jackpot</div>
                    <div className="text-xl font-black text-accent">{draw.jackpot?.toLocaleString()} HTG</div>
                  </div>
                  <div className="flex items-center gap-1 text-green-500 font-bold text-xs uppercase">
                    <Star size={14} fill="currentColor" /> {draw.status}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-slate-400 font-bold italic">
              Aucun tirage récent disponible.
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-100 py-24 dark:bg-dark-surface/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter mb-4">
              Pourquoi nous choisir ?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Nous offrons la meilleure expérience de loterie en Haïti avec une sécurité inégalée et des gains rapides.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:shadow-xl transition-all dark:bg-dark-surface dark:border-dark-border"
              >
                <div className="w-16 h-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 dark:bg-secondary/5 dark:text-secondary">
                  <f.icon size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 dark:text-white uppercase italic">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden dark:bg-black border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase italic leading-none">
            Prêt à devenir le prochain <span className="text-secondary">millionnaire ?</span>
          </h2>
          <p className="text-slate-300 mb-12 max-w-xl mx-auto font-medium">
            Rejoignez des milliers de joueurs satisfaits et tentez votre chance aujourd'hui. L'inscription est rapide et gratuite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/profile" className="btn-secondary px-12 py-4 text-lg">
              Créer un compte
            </Link>
            <Link to="/rules" className="bg-white/10 text-white border border-white/20 px-12 py-4 rounded-xl font-bold hover:bg-white/20 transition-all">
              Comment jouer ?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
