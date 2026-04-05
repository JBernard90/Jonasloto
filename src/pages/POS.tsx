import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { handleSupabaseError, OperationType } from '../lib/supabaseUtils';
import { motion, AnimatePresence } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Monitor, 
  Ticket, 
  DollarSign, 
  Printer, 
  Search, 
  CheckCircle2, 
  History,
  UserPlus,
  Zap,
  ChevronLeft,
  Dices
} from 'lucide-react';
import { LOTTERY_CONFIG, LOTO_DIGITS } from '../constants/lottery';

export default function POS() {
  const { t } = useTranslation();
  const [borlette, setBorlette] = useState('');
  const [selectedLotos, setSelectedLotos] = useState<string[]>([]);
  const [lotoEntries, setLotoEntries] = useState<Record<string, { numbers: string[], amounts: number[] }>>({});
  const [loading, setLoading] = useState(false);
  const [lastTicket, setLastTicket] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [sessionTotal, setSessionTotal] = useState(0);

  const borletteTypes = Object.keys(LOTTERY_CONFIG);

  useEffect(() => {
    fetchRecentSales();
  }, []);

  const fetchRecentSales = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('agentId', user.id)
        .order('createdAt', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentSales(data || []);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayData, error: todayError } = await supabase
        .from('tickets')
        .select('amount')
        .eq('agentId', user.id)
        .gte('createdAt', today.toISOString());

      if (!todayError && todayData) {
        const total = todayData.reduce((sum, t) => sum + (t.amount || 0), 0);
        setSessionTotal(total);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const handleBorletteSelect = (type: string) => {
    setBorlette(type);
    setSelectedLotos([]);
    setLotoEntries({});
    setStep(2);
  };

  const toggleLoto = (loto: string) => {
    setSelectedLotos(prev => {
      const isSelected = prev.includes(loto);
      if (isSelected) {
        return prev.filter(l => l !== loto);
      } else {
        return [...prev, loto];
      }
    });
  };

  const handleLotoNumberChange = (loto: string, index: number, value: string) => {
    const numValue = value.replace(/\D/g, '');
    setLotoEntries(prev => ({
      ...prev,
      [loto]: {
        ...(prev[loto] || { numbers: ['', '', ''], amounts: [0, 0, 0] }),
        numbers: [
          ...((prev[loto]?.numbers) || ['', '', '']).slice(0, index),
          numValue,
          ...((prev[loto]?.numbers) || ['', '', '']).slice(index + 1)
        ]
      }
    }));
  };

  const handleLotoAmountChange = (loto: string, index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setLotoEntries(prev => ({
      ...prev,
      [loto]: {
        ...(prev[loto] || { numbers: ['', '', ''], amounts: [0, 0, 0] }),
        amounts: [
          ...((prev[loto]?.amounts) || [0, 0, 0]).slice(0, index),
          numValue,
          ...((prev[loto]?.amounts) || [0, 0, 0]).slice(index + 1)
        ]
      }
    }));
  };

  const calculateTotal = () => {
    return Object.values(lotoEntries).reduce((sum, entry) => {
      return sum + entry.amounts.reduce((a, b) => a + b, 0);
    }, 0);
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const ticket = {
        userId: user.id,
        agentId: user.id,
        borlette,
        entries: lotoEntries,
        amount: calculateTotal(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert([ticket])
        .select()
        .single();

      if (error) throw error;

      setLastTicket(data);
      setBorlette('');
      setSelectedLotos([]);
      setLotoEntries({});
      setStep(1);
      
      await fetchRecentSales();
      alert(t('ticket_created_success') || 'Ticket créé avec succès!');
    } catch (error) {
      handleSupabaseError(error, OperationType.CREATE, 'tickets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Monitor size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Point de Vente</h1>
            <p className="text-gray-500">Interface de vente de billets</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Session</div>
          <div className="text-2xl font-black text-primary">{sessionTotal.toLocaleString()} HTG</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sale Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            {step === 1 ? (
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-6">Sélectionner une Borlette</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {borletteTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleBorletteSelect(type)}
                      className="p-6 border-2 border-gray-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-center font-bold text-gray-900 hover:text-primary"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaleSubmit} className="space-y-8">
                <div className="flex items-center justify-between mb-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-primary font-bold hover:underline"
                  >
                    <ChevronLeft size={18} /> Retour
                  </button>
                  <h2 className="text-2xl font-black text-gray-900">{borlette}</h2>
                  <div></div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-4">Sélectionner les Lotos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {borlette && LOTTERY_CONFIG[borlette as keyof typeof LOTTERY_CONFIG]?.games.map((game: any) => (
                      <button
                        key={game}
                        type="button"
                        onClick={() => toggleLoto(game)}
                        className={`p-4 border-2 rounded-xl font-bold transition-all ${
                          selectedLotos.includes(game)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-100 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {game}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedLotos.map(loto => (
                  <div key={loto} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="font-black text-gray-900 mb-4">{loto}</h4>
                    <div className="space-y-3">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="00"
                            value={lotoEntries[loto]?.numbers[i] || ''}
                            onChange={(e) => handleLotoNumberChange(loto, i, e.target.value)}
                            className="p-3 bg-white border border-gray-200 rounded-lg text-center font-black focus:ring-2 focus:ring-primary focus:outline-none"
                          />
                          <input
                            type="number"
                            placeholder="Montant"
                            value={lotoEntries[loto]?.amounts[i] || ''}
                            onChange={(e) => handleLotoAmountChange(loto, i, e.target.value)}
                            className="col-span-2 p-3 bg-white border border-gray-200 rounded-lg font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {selectedLotos.length > 0 && (
                  <div>
                    <div className="bg-primary text-white p-6 rounded-2xl mb-6">
                      <div className="text-sm text-white/60 font-bold uppercase tracking-widest mb-1">Total</div>
                      <div className="text-3xl font-black">{calculateTotal().toLocaleString()} HTG</div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? '...' : (
                        <>
                          <CheckCircle2 size={20} />
                          Valider la Vente
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Recent Sales Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <History size={20} className="text-primary" />
              <h3 className="font-black text-gray-900">Dernières Ventes</h3>
            </div>
            <div className="space-y-4">
              {recentSales.length === 0 ? (
                <p className="text-gray-400 text-sm">Aucune vente</p>
              ) : (
                recentSales.map(sale => (
                  <div key={sale.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-sm font-bold text-gray-900 mb-1">{sale.borlette}</div>
                    <div className="text-xs text-gray-400 mb-2">
                      {sale.createdAt ? formatDistanceToNow(new Date(sale.createdAt), { locale: fr, addSuffix: true }) : ''}
                    </div>
                    <div className="text-lg font-black text-primary">{(sale.amount || 0).toLocaleString()} HTG</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
