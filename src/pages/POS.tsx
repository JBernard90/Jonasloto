import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Monitor, Ticket, DollarSign, Printer, 
  Search, CheckCircle2, History, UserPlus, 
  Zap, ChevronLeft, Dices, Trash2, PlusCircle,
  Camera, AlertCircle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  'Marriage': 4,
};

export default function POS() {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [borlette, setBorlette] = useState('');
  const [selectedLotos, setSelectedLotos] = useState<string[]>([]);
  const [lotoEntries, setLotoEntries] = useState<Record<string, { numbers: string[], amounts: number[] }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTicket, setLastTicket] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [todaySales, setTodaySales] = useState(0);
  const [todayTicketsCount, setTodayTicketsCount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    displayName: '',
    email: '',
    phoneNumber: ''
  });
  const [clientLoading, setClientLoading] = useState(false);
  const [verifyId, setVerifyId] = useState('');
  const [verifiedTicket, setVerifiedTicket] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRecentSales(session.user.id).catch(err => console.error('Jonas Loto Center: Error fetching recent sales in POS:', err));
    }).catch(err => {
      console.error('Jonas Loto Center: Error getting session in POS:', err);
    });

    let channel: any;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('pos_updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
          if (payload.new.agentId === user?.id) {
            setRecentSales(prev => [payload.new, ...prev].slice(0, 5));
            setTodaySales(prev => prev + (payload.new.amount || 0));
            setTodayTicketsCount(prev => prev + 1);
          }
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Jonas Loto Center: POS updates channel subscription error - check your Supabase Realtime configuration and table publications');
          }
        });
    }

    return () => {
      if (channel) supabase.removeChannel(channel).catch(err => console.error('Jonas Loto Center: Error removing POS channel:', err));
    };
  }, [user]);

  const fetchRecentSales = async (agentId: string) => {
    try {
      const { data, error: salesError } = await supabase
        .from('tickets')
        .select('*')
        .eq('agentId', agentId)
        .order('createdAt', { ascending: false })
        .limit(5);
      
      if (salesError) throw salesError;
      if (data) setRecentSales(data);
  
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayData, count, error: todayError } = await supabase
        .from('tickets')
        .select('amount', { count: 'exact' })
        .eq('agentId', agentId)
        .gte('createdAt', today.toISOString());
      
      if (todayError) throw todayError;
  
      const total = todayData?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
      setTodaySales(total);
      setTodayTicketsCount(count || 0);
    } catch (err) {
      console.error('Jonas Loto Center: Error fetching recent sales in POS:', err);
    }
  };

  const handleBorletteSelect = (type: string) => {
    setBorlette(type);
    setStep(2);
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

  const handleSale = async () => {
    if (!user) return;
    
    // Validate entries
    for (const loto of selectedLotos) {
      const entry = lotoEntries[loto];
      const requiredDigits = LOTO_DIGITS[loto] || 2;
      for (const num of entry.numbers) {
        if (num.length < requiredDigits) {
          setError(`Veuillez entrer ${requiredDigits} chiffres pour ${loto}`);
          return;
        }
      }
    }

    setLoading(true);
    setError(null);
    console.log('Jonas Loto Center: Starting POS sale...', { borlette, selectedLotos, totalAmount });

    try {
      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          agentId: user.id,
          userId: null,
          borlette,
          lotos: selectedLotos,
          entries: lotoEntries,
          amount: totalAmount,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setLastTicket(ticket);
      
      // Reset
      setBorlette('');
      setSelectedLotos([]);
      setLotoEntries({});
      setStep(1);
      
      // Log transaction for agent
      await supabase.from('transactions').insert({
        userId: user.id,
        amount: totalAmount,
        type: 'purchase',
        status: 'completed',
        description: `Vente POS ${borlette} #${ticket.id.slice(0, 8)}`
      });

    } catch (err: any) {
      console.error('Jonas Loto Center: POS handleSale error:', err);
      setError(err.message || "Une erreur est survenue lors de la vente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientLoading(true);
    try {
      const { error } = await supabase.from('users').insert({
        ...newClient,
        role: 'client',
        status: 'active',
        balance: 0,
        createdAt: new Date().toISOString()
      });
      if (error) throw error;
      setIsClientModalOpen(false);
      setNewClient({ displayName: '', email: '', phoneNumber: '' });
      alert('Compte client créé avec succès !');
    } catch (err: any) {
      console.error('Jonas Loto Center: Error creating client in POS:', err);
      alert('Erreur lors de la création du compte client: ' + err.message);
    } finally {
      setClientLoading(false);
    }
  };

  const handleVerifyTicket = async () => {
    if (!verifyId) return;
    setVerifying(true);
    setVerifiedTicket(null);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, agent:users!agentId(displayName)')
        .eq('id', verifyId)
        .single();
      
      if (error) throw error;
      setVerifiedTicket(data);
    } catch (err: any) {
      console.error('Jonas Loto Center: Error verifying ticket in POS:', err);
      alert('Billet non trouvé ou erreur: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* POS Terminal */}
        <div className="lg:col-span-2 space-y-8">
          {error && (
            <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl flex items-center gap-3 text-accent text-xs font-bold">
              <AlertCircle size={18} /> {error}
            </div>
          )}
          <div className="card p-8 md:p-10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
                <Monitor className="text-primary dark:text-secondary" /> Terminal de Vente
              </h2>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest dark:bg-green-500/10">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Connecté
              </div>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Choisir une Borlette</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.keys(LOTTERY_CONFIG).map(type => (
                      <button
                        key={type}
                        onClick={() => handleBorletteSelect(type)}
                        className="p-8 rounded-[2rem] border-2 border-slate-100 hover:border-primary/20 transition-all text-left group dark:border-dark-border dark:hover:border-secondary/20"
                      >
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-primary dark:group-hover:text-secondary">Région</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">{type}</div>
                      </button>
                    ))}
                  </div>
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
                      <ChevronLeft size={20} /> Retour
                    </button>
                    <div className="px-4 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-widest dark:bg-secondary/5 dark:text-secondary">
                      Borlette: {borlette}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
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

                  <div className="space-y-6">
                    {selectedLotos.map(loto => (
                      <div key={loto} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 dark:bg-dark-bg dark:border-dark-border">
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
                            <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 dark:bg-dark-surface dark:border-dark-border">
                              <input 
                                type="text"
                                maxLength={LOTO_DIGITS[loto]}
                                value={num}
                                onChange={(e) => updateLotoEntry(loto, idx, 'numbers', e.target.value)}
                                className="w-16 h-16 text-center text-3xl font-black bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary focus:outline-none transition-all dark:bg-dark-bg dark:border-dark-border dark:text-white dark:focus:border-secondary"
                                placeholder={"0".repeat(LOTO_DIGITS[loto])}
                              />
                              <div className="flex-grow flex flex-wrap gap-2">
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
                                    {val}
                                  </button>
                                ))}
                                <input 
                                  type="number"
                                  placeholder="HTG"
                                  value={lotoEntries[loto].amounts[idx] || ''}
                                  onChange={(e) => updateLotoEntry(loto, idx, 'amounts', e.target.value)}
                                  className="w-20 py-2 px-3 bg-white border-2 border-slate-100 rounded-xl text-center font-black text-xs focus:border-primary focus:outline-none dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-secondary"
                                />
                                {lotoEntries[loto].numbers.length > 1 && (
                                  <button 
                                    onClick={() => removeLineFromLoto(loto, idx)}
                                    className="text-accent p-2"
                                  >
                                    &times;
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

                  <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-6 dark:bg-secondary/5 dark:border-secondary/10">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total à encaisser</div>
                      <div className="text-4xl font-black text-primary dark:text-secondary tracking-tighter">{totalAmount.toLocaleString()} HTG</div>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                      <button 
                        onClick={handleSale}
                        disabled={loading || totalAmount <= 0}
                        className="flex-grow btn-primary py-5 px-12 text-xl flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Zap size={24} /> VENDRE & IMPRIMER
                          </>
                        )}
                      </button>
                      <button 
                        onClick={handlePrint}
                        className="bg-slate-100 text-slate-600 px-6 rounded-2xl hover:bg-slate-200 transition-all dark:bg-dark-bg dark:text-slate-400"
                      >
                        <Printer size={24} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
                <History className="text-primary dark:text-secondary" /> Ventes Récentes
              </h3>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session: {todaySales.toLocaleString()} HTG</div>
            </div>
            
            <div className="space-y-4">
              {recentSales.map((sale, i) => (
                <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 dark:bg-dark-bg dark:border-dark-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm dark:bg-dark-surface dark:text-secondary">
                      <Ticket size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{sale.borlette}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {formatDistanceToNow(new Date(sale.createdAt), { addSuffix: true, locale: fr })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-white">{sale.amount.toLocaleString()} HTG</div>
                    <div className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Payé Cash</div>
                  </div>
                </div>
              ))}
              {recentSales.length === 0 && (
                <p className="text-center py-8 text-slate-400 font-bold italic text-sm">Aucune vente pour le moment.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-8">
          {/* Performance Metrics */}
          <div className="card p-8 border-2 border-primary/10 dark:border-secondary/10 bg-gradient-to-br from-white to-slate-50 dark:from-dark-surface dark:to-dark-bg">
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-2 text-slate-900 dark:text-white">
              <Zap className="text-primary dark:text-secondary" /> Performance du Jour
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm dark:bg-dark-bg dark:border-dark-border">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventes</div>
                <div className="text-xl font-black text-primary dark:text-secondary tracking-tighter">
                  {todaySales.toLocaleString()} <span className="text-[10px]">HTG</span>
                </div>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm dark:bg-dark-bg dark:border-dark-border">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billets</div>
                <div className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {todayTicketsCount}
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-slate-900 text-white border-none p-8 dark:bg-black">
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-2">
              <DollarSign className="text-secondary" /> Vérifier un Billet
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="ID du billet..."
                  value={verifyId}
                  onChange={(e) => setVerifyId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleVerifyTicket}
                  disabled={verifying}
                  className="btn-primary py-4 text-xs"
                >
                  {verifying ? '...' : 'Vérifier'}
                </button>
                <button 
                  onClick={() => setScanning(true)}
                  className="bg-slate-800 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Camera size={16} /> Scanner
                </button>
              </div>

              {verifiedTicket && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-slate-800 rounded-2xl space-y-2"
                >
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">Statut</span>
                    <span className={verifiedTicket.status === 'won' ? 'text-green-500' : 'text-primary'}>{verifiedTicket.status.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">Montant</span>
                    <span className="text-white">{verifiedTicket.amount} HTG</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">Agent</span>
                    <span className="text-white">{verifiedTicket.agent?.displayName || 'Inconnu'}</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {lastTicket && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card border-2 border-primary dark:border-secondary p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 bg-primary text-white text-[8px] font-black uppercase dark:bg-secondary dark:text-primary">Dernier Reçu</div>
              <div className="text-center space-y-6">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jonas Loto Center</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">{lastTicket.borlette}</div>
                <div className="text-xs text-slate-400">{format(new Date(lastTicket.createdAt), 'PPP HH:mm', { locale: fr })}</div>
                
                <div className="space-y-2 text-left">
                  {Object.entries(lastTicket.entries).map(([loto, entry]: [string, any]) => (
                    <div key={loto} className="bg-slate-50 p-3 rounded-xl dark:bg-dark-bg">
                      <div className="text-[8px] font-black text-primary uppercase mb-2 dark:text-secondary">{loto}</div>
                      {entry.numbers.map((n: string, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-900 dark:text-white">{n}</span>
                          <span className="text-slate-400">{entry.amounts[idx]} HTG</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-dashed border-slate-200 dark:border-dark-border">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</div>
                  <div className="text-2xl font-black text-primary dark:text-secondary mb-6">{lastTicket.amount.toLocaleString()} HTG</div>
                  
                  <div className="flex justify-center mb-6 bg-white p-4 rounded-2xl shadow-sm">
                    <QRCodeSVG 
                      value={JSON.stringify({ id: lastTicket.id, amount: lastTicket.amount, date: lastTicket.createdAt })} 
                      size={128}
                    />
                  </div>
                </div>

                <button 
                  onClick={handlePrint}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={16} /> Réimprimer
                </button>
              </div>
            </motion.div>
          )}

          <div className="card bg-primary/5 border-primary/10 p-8 dark:bg-secondary/5 dark:border-secondary/10">
            <h3 className="text-lg font-black text-primary dark:text-secondary uppercase italic tracking-tighter mb-4 flex items-center gap-2">
              <UserPlus size={20} /> Nouveau Client ?
            </h3>
            <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">Inscrivez le client pour qu'il puisse recevoir ses notifications de gains par SMS et e-mail.</p>
            <button 
              onClick={() => setIsClientModalOpen(true)}
              className="w-full py-3 rounded-xl border border-primary/20 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all dark:border-secondary/20 dark:text-secondary"
            >
              Créer un compte client
            </button>
          </div>
        </div>
      </div>

      {/* Create Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-surface rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Nouveau Client</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-dark-bg">
                <PlusCircle className="rotate-45 text-slate-400" size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom Complet</label>
                <input 
                  type="text"
                  placeholder="Jean Dupont"
                  className="input-field"
                  value={newClient.displayName}
                  onChange={(e) => setNewClient({...newClient, displayName: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input 
                  type="email"
                  placeholder="client@email.com"
                  className="input-field"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone</label>
                <input 
                  type="tel"
                  placeholder="1234 5678"
                  className="input-field"
                  value={newClient.phoneNumber}
                  onChange={(e) => setNewClient({...newClient, phoneNumber: e.target.value})}
                  required
                />
              </div>

              <button type="submit" disabled={clientLoading} className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-2">
                {clientLoading ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserPlus size={20} /> Créer le compte
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
