import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Trophy, ArrowRight, Star, ShieldCheck, Zap, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import Logo from '../components/Logo';

interface Draw {
  id: string;
  type: string;
  date: string;
  numbers: string[];
  jackpot: number;
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const [recentDraws, setRecentDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentDraws = async () => {
      try {
        const { data } = await supabase
          .from('draws')
          .select('*')
          .order('date', { ascending: false })
          .limit(6);
        
        if (data) {
          setRecentDraws(data);
        }
      } catch (err) {
        console.error('Error fetching draws:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDraws();
  }, []);

  const getDateLocale = () => {
    return i18n.language === 'fr' ? fr : enUS;
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark text-white p-8 md:p-16 shadow-2xl border-b-8 border-secondary">
        <div className="relative z-10 max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-none italic uppercase"
          >
            JOUEZ. <br /> <span className="text-secondary">GAGNEZ.</span> <br /> CHANGEZ VOTRE VIE.
          </motion.h1>
          <p className="text-xl text-white/80 mb-8 max-w-lg">
            La loterie la plus fiable d'Haïti est maintenant en ligne. Achetez vos billets avec MonCash, NatCash ou Lajan Cash en quelques clics.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/buy" 
              className="bg-secondary text-primary px-8 py-4 rounded-full font-black text-lg hover:bg-white transition-all flex items-center gap-2 shadow-lg hover:scale-105 uppercase tracking-wider"
            >
              {t('buy_ticket') || 'Buy Ticket'}
              <ArrowRight size={20} />
            </Link>
            <Link 
              to="/results" 
              className="bg-primary-dark/40 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary-dark/60 transition-all uppercase tracking-wider"
            >
              {t('results') || 'Results'}
            </Link>
          </div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-secondary rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 bg-accent rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </section>

      {/* Recent Results */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('recent_results') || 'Recent Results'}</h2>
            <p className="text-gray-500">Derniers tirages officiels</p>
          </div>
          <Link to="/results" className="text-primary font-black flex items-center gap-1 hover:underline uppercase text-sm tracking-wider">
            Voir tout <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentDraws.map((draw) => (
              <motion.div 
                key={draw.id}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-secondary/20 text-primary-dark px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-secondary/30">
                    {draw.type}
                  </span>
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    {draw.date ? format(parseISO(draw.date), 'PPP', { locale: getDateLocale() }) : ''}
                  </span>
                </div>
                <div className="flex gap-2 mb-6">
                  {draw.numbers.map((num, idx) => (
                    <div 
                      key={idx} 
                      className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg border-2 border-secondary/20"
                    >
                      {num}
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Jackpot</div>
                  <div className="text-xl font-black text-accent">
                    {draw.jackpot.toLocaleString()} HTG
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Features / Why Us */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        <div className="flex flex-col items-center text-center p-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">100% Sécurisé</h3>
          <p className="text-gray-500 text-sm">Transactions cryptées et résultats certifiés par les autorités compétentes.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6">
          <div className="w-16 h-16 bg-secondary/20 text-primary-dark rounded-2xl flex items-center justify-center mb-6 border border-secondary/30">
            <Zap size={32} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">Paiements Instantanés</h3>
          <p className="text-gray-500 text-sm">Recevez vos gains directement sur MonCash, NatCash ou Lajan Cash en quelques minutes.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 border border-accent/20">
            <Star size={32} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">Programme Fidélité</h3>
          <p className="text-gray-500 text-sm">Cumulez des points à chaque achat et échangez-les contre des billets gratuits.</p>
        </div>
      </section>

      {/* Become an Agent Section */}
      <section className="bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 bg-secondary text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-sm">
            <Zap size={14} /> Opportunité
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight uppercase italic">
            <Logo className="inline-block mr-2" />
            <span className="text-primary">Become</span> <span className="text-accent">an Agent</span>
          </h2>
          <p className="text-gray-600 mb-6">
            {t('become_agent_desc') || 'Become an agent'} Profitez de notre technologie avancée et de notre support dédié pour développer votre propre entreprise de loterie.
          </p>
          <Link 
            to="/contact" 
            className="inline-flex items-center gap-2 text-primary font-black uppercase text-sm tracking-widest hover:gap-3 transition-all"
          >
            {t('join_network') || 'Join Network'} <ArrowRight size={18} />
          </Link>
        </div>
        <div className="hidden md:block">
          <div className="w-48 h-48 bg-white rounded-3xl shadow-xl border border-secondary/20 flex items-center justify-center -rotate-6">
            <Monitor size={64} className="text-primary" />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary text-white rounded-3xl p-12 text-center border-t-8 border-secondary shadow-2xl">
        <h2 className="text-4xl font-black mb-6 tracking-tight uppercase italic">Prêt à tenter votre chance ?</h2>
        <p className="text-white/60 mb-8 max-w-xl mx-auto">
          Rejoignez des milliers de joueurs haïtiens et commencez à jouer dès aujourd'hui sur la plateforme la plus moderne du pays.
        </p>
        <Link 
          to="/profile" 
          className="inline-block bg-secondary text-primary px-10 py-4 rounded-full font-black text-lg hover:bg-white transition-all shadow-xl uppercase tracking-widest"
        >
          Créer un compte gratuit
        </Link>
      </section>
    </div>
  );
}
