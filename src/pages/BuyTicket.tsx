import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, History, Star, Search, 
  Filter, ChevronRight, ArrowRight, TrendingUp,
  Zap, ShieldCheck, Smartphone, CheckCircle2,
  Trash2, PlusCircle, DollarSign, Dices, AlertCircle,
  Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const LOTTERY_CONFIG: Record<string, string[]> = {
  'New York': ['Borlette', 'Loto 3', 'Loto 4', 'Loto 5', 'Marriage'],
  'Florida': ['Borlette', 'Loto 3', 'Loto 4', 'Loto 5', 'Marriage'],
  'Georgia': ['Borlette', 'Loto 3', 'Loto 4', 'Loto 5', 'Marriage'],
};

const LOTO_DIGITS: Record<string, number> = {
  'Borlette': 2,
  'Loto 3': 3,
  'Loto 4': 4,
  'Loto 5': 5,
  'Marriage': 4, // 2 numbers of 2 digits
};

export default function BuyTicket({ user: initialUser }: { user?: any }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(initialUser || null);
  const [userData, setUserData] = useState<any>(null);
  const [borlette, setBorlette] = useState('New York');
  const [selectedLotos, setSelectedLotos] = useState<string[]>([]);
  const [lotoEntries, setLotoEntries] = useState<Record<string, { numbers: string[], amounts: number[] }>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserData(session.user.id);
    });
  }, []);

  const fetchUserData = async (uid: string) => {
    const { data } = await supabase.from('users').select('*').eq('uid', uid).single();
    if (data) setUserData(data);
  };

  const toggleLoto = (loto: string) => {
    setSelectedLotos(prev => {
      const isSelected = prev.includes(loto);
      const next = isSelected ? prev.filter(l => l !== loto) : [...prev, loto];
      
      if (!isSelected) {
        setLotoEntries(entries => ({
          ...entries,
          [loto]: { numbers: [''], amounts: [5] }
        }));
      } else {
        const newEntries = { ...lotoEntries };
        delete newEntries[loto];
        setLotoEntries(newEntries);
      }
      
      return next;
    });
  };

  const updateLotoEntry = (loto: string, index: number, field: 'numbers' | 'amounts', value: any) => {
    setLotoEntries(prev => {
      const entry = { ...prev[loto] };
      if (field === 'numbers') {
        entry.numbers[index] = value.replace(/\D/g, '');
      } else {
        entry.amounts[index] = Number(value);
      }
      return { ...prev, [loto]: entry };
    });
  };

  const addLineToLoto = (loto: string) => {
    setLotoEntries(prev => {
      const entry = { ...prev[loto] };
      entry.numbers.push('');
      entry.amounts.push(5);
      return { ...prev, [loto]: entry };
    });
  };

  const removeLineFromLoto = (loto: string, index: number) => {
    setLotoEntries(prev => {
      const entry = { ...prev[loto] };
      if (entry.numbers.length > 1) {
        entry.numbers.splice(index, 1);
        entry.amounts.splice(index, 1);
      }
      return { ...prev, [loto]: entry };
    });
  };

  const totalAmount = (Object.values(lotoEntries) as any[]).reduce((sum: number, entry: any) => {
    return sum + (entry.amounts as number[]).reduce((s, a) => s + (a || 0), 0);
  }, 0);

  const generateRandomNumbers = (loto: string) => {
    const digits = LOTO_DIGITS[loto] || 2;
    setLotoEntries(prev => {
      const entry = { ...prev[loto] };
      entry.numbers = entry.numbers.map(() => 
        Math.floor(Math.random() * Math.pow(10, digits)).toString().padStart(digits, '0')
      );
      return { ...prev, [loto]: entry };
    });
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate('/profile');
      return;
    }

    if (userData.balance < totalAmount) {
      setError(t('insufficient_balance'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create Ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          userId: user.id,
          borlette,
          lotos: selectedLotos,
          entries: lotoEntries,
          amount: totalAmount,
          status: 'active'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Create Transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          userId: user.id,
          amount: totalAmount,
          type: 'purchase',
          status: 'completed',
          description: `Achat Billet ${borlette} #${ticket.id.slice(0, 8)}`
        });

      if (txError) throw txError;

      // 3. Update User Balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: userData.balance - totalAmount })
        .eq('uid', user.id);

      if (balanceError) throw balanceError;

      // Success
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter mb-2">
          {t('buy_ticket')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Choisissez vos numéros et tentez de remporter le jackpot !</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="card">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                <Globe className="text-primary dark:text-secondary" /> 1. Choisir une Borlette
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(LOTTERY_CONFIG).map(type => (
                  <button
                    key={type}
                    onClick={() => setBorlette(type)}
                    className={`p-6 rounded-3xl border-2 transition-all text-left group ${
                      borlette === type 
                        ? 'border-primary bg-primary/5 dark:border-secondary dark:bg-secondary/5' 
                        : 'border-slate-100 hover:border-primary/20 dark:border-dark-border dark:hover:border-secondary/20'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-primary dark:group-hover:text-secondary">Région</div>
                    <div className={`text-xl font-black uppercase italic ${borlette === type ? 'text-primary dark:text-secondary' : 'text-slate-900 dark:text-white'}`}>
                      {type}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                <Ticket className="text-primary dark:text-secondary" /> 2. Sélectionner les Lotos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {LOTTERY_CONFIG[borlette].map(loto => (
                  <button
                    key={loto}
                    onClick={() => toggleLoto(loto)}
                    className={`p-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all text-center ${
                      selectedLotos.includes(loto) 
                        ? 'border-primary bg-primary text-white shadow-lg dark:border-secondary dark:bg-secondary dark:text-primary' 
                        : 'border-slate-100 hover:border-primary/20 text-slate-500 dark:border-dark-border dark:text-slate-400'
                    }`}
                  >
                    {loto}
                  </button>
                ))}
              </div>
            </div>

            {selectedLotos.length > 0 && (
              <div className="flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  className="btn-primary flex items-center gap-2 px-10"
                >
                  Suivant <ChevronRight size={20} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setStep(1)} className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-primary transition-all flex items-center gap-2">
                <ChevronRight size={16} className="rotate-180" /> Retour
              </button>
              <div className="px-4 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-widest dark:bg-secondary/5 dark:text-secondary">
                Borlette: {borlette}
              </div>
            </div>

            <div className="space-y-6">
              {selectedLotos.map(loto => (
                <div key={loto} className="card border-l-8 border-primary dark:border-secondary">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter">{loto}</h3>
                    <button 
                      onClick={() => generateRandomNumbers(loto)}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary dark:hover:text-secondary flex items-center gap-1"
                    >
                      <Dices size={14} /> Aléatoire
                    </button>
                  </div>

                  <div className="space-y-4">
                    {lotoEntries[loto]?.numbers.map((num, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 dark:bg-dark-bg dark:border-dark-border">
                        <div className="flex items-center gap-4 flex-grow">
                          <input 
                            type="text"
                            maxLength={LOTO_DIGITS[loto]}
                            value={num}
                            onChange={(e) => updateLotoEntry(loto, idx, 'numbers', e.target.value)}
                            className="w-20 h-20 text-center text-3xl font-black bg-white border-2 border-slate-100 rounded-2xl focus:border-primary focus:outline-none transition-all dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-secondary"
                            placeholder={"0".repeat(LOTO_DIGITS[loto])}
                          />
                          <div className="flex-grow">
                            <div className="flex flex-wrap gap-2">
                              {[5, 10, 25, 50, 100].map(val => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => updateLotoEntry(loto, idx, 'amounts', val)}
                                  className={`px-3 py-2 rounded-lg border font-black text-[10px] uppercase tracking-widest transition-all ${
                                    lotoEntries[loto].amounts[idx] === val 
                                      ? 'bg-slate-900 border-slate-900 text-white dark:bg-secondary dark:border-secondary dark:text-primary' 
                                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-dark-surface dark:border-dark-border dark:text-slate-400'
                                  }`}
                                >
                                  {val} HTG
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="number"
                              placeholder="HTG"
                              value={lotoEntries[loto].amounts[idx] || ''}
                              onChange={(e) => updateLotoEntry(loto, idx, 'amounts', e.target.value)}
                              className="w-24 pl-8 pr-3 py-3 bg-white border-2 border-slate-100 rounded-xl text-center font-black text-sm focus:border-primary focus:outline-none dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-secondary"
                            />
                          </div>
                          {lotoEntries[loto].numbers.length > 1 && (
                            <button 
                              onClick={() => removeLineFromLoto(loto, idx)}
                              className="text-accent hover:bg-accent/5 p-2 rounded-lg transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => addLineToLoto(loto)}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1 dark:text-secondary"
                    >
                      <PlusCircle size={14} /> Ajouter une ligne
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card bg-primary text-white dark:bg-black border-none p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total à payer</div>
                <div className="text-4xl font-black text-secondary tracking-tighter">{totalAmount.toLocaleString()} HTG</div>
              </div>
              
              <div className="flex flex-col gap-4 w-full md:w-auto">
                {error && (
                  <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                <button 
                  onClick={handlePurchase}
                  disabled={loading || totalAmount <= 0}
                  className="btn-secondary py-4 px-12 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ShieldCheck size={24} /> {t('confirm_purchase')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center py-20 space-y-8"
          >
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto dark:bg-green-500/10">
              <CheckCircle2 size={64} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Achat Réussi !</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Votre billet a été enregistré avec succès. Bonne chance !</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/profile')} className="btn-primary">
                Voir mes billets
              </button>
              <button onClick={() => { setStep(1); setLotoEntries({}); setSelectedLotos([]); }} className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all dark:bg-dark-bg dark:text-slate-400">
                Acheter un autre
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
