import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
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
  const [step, setStep] = useState(1);

  const borletteTypes = Object.keys(LOTTERY_CONFIG);

  const handleBorletteSelect = (type: string) => {
    setBorlette(type);
    setSelectedLotos([]);
    setLotoEntries({});
    setStep(2);
  };

  const toggleLoto = (loto: string) => {
    setSelectedLotos(prev => {
      const isSelected = prev.includes(loto);
      const next = isSelected ? prev.filter(l => l !== loto) : [...prev, loto];
      
      if (!isSelected) {
        setLotoEntries(entries => ({
          ...entries,
          [loto]: { 
            numbers: [''], 
            amounts: [5] 
          }
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

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticketData = {
        userId: 'anonymous_pos',
        agentId: auth.currentUser?.uid,
        borlette,
        lotos: selectedLotos,
        entries: lotoEntries,
        amount: totalAmount,
        status: 'active',
        type: 'physical',
        paymentMethod: 'Cash',
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      setLastTicket({ id: docRef.id, ...ticketData });
      
      // Reset
      setBorlette('');
      setSelectedLotos([]);
      setLotoEntries({});
      setStep(1);
      
      console.log("Printing ticket...", docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tickets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* POS Terminal */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Monitor className="text-primary" /> Terminal de Vente
            </h2>
            <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-full text-xs font-bold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Connecté
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Choisir une Borlette</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {borletteTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleBorletteSelect(type)}
                      className="p-6 rounded-2xl border-2 border-gray-100 hover:border-primary/20 transition-all text-left group"
                    >
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-primary-light">Région</div>
                      <div className="text-xl font-black text-gray-900">{type}</div>
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
              >
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-600">
                    <ChevronLeft size={20} /> Retour
                  </button>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Borlette: {borlette}</span>
                </div>

                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Sélectionner les Lotos</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {LOTTERY_CONFIG[borlette].map(loto => (
                    <button
                      key={loto}
                      onClick={() => toggleLoto(loto)}
                      className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all text-center ${
                        selectedLotos.includes(loto) ? 'border-primary bg-primary text-white shadow-lg' : 'border-gray-100 hover:border-primary/20 text-gray-600'
                      }`}
                    >
                      {loto}
                    </button>
                  ))}
                </div>

                <div className="space-y-6 mb-8">
                  {selectedLotos.map(loto => (
                    <div key={loto} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-primary">{loto}</h3>
                        <button 
                          onClick={() => generateRandomNumbers(loto)}
                          className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1"
                        >
                          <Dices size={14} /> Aléatoire
                        </button>
                      </div>

                      <div className="space-y-4">
                        {lotoEntries[loto]?.numbers.map((num, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100">
                            <input 
                              type="text"
                              maxLength={LOTO_DIGITS[loto]}
                              value={num}
                              onChange={(e) => updateLotoEntry(loto, idx, 'numbers', e.target.value)}
                              className="w-16 h-16 text-center text-2xl font-black bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:outline-none transition-all"
                              placeholder={"0".repeat(LOTO_DIGITS[loto])}
                            />
                            <div className="flex-grow">
                              <div className="flex flex-wrap gap-2">
                                {[5, 11, 15, 17, 25, 50, 100].map(val => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => updateLotoEntry(loto, idx, 'amounts', val)}
                                    className={`px-3 py-2 rounded-lg border font-bold text-xs transition-all ${
                                      lotoEntries[loto].amounts[idx] === val ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
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
                                  className="w-24 py-2 px-3 bg-white border-2 border-gray-100 rounded-xl text-center font-black text-sm focus:border-primary focus:outline-none"
                                />
                                {lotoEntries[loto].numbers.length > 1 && (
                                  <button 
                                    onClick={() => removeLineFromLoto(loto, idx)}
                                    className="text-red-400 hover:text-red-600 p-2"
                                  >
                                    &times;
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => addLineToLoto(loto)}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          + Ajouter une ligne
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex justify-between items-center mb-8">
                  <span className="text-sm font-bold text-primary-dark uppercase tracking-widest">Total à encaisser</span>
                  <span className="text-3xl font-black text-primary">{totalAmount} HTG</span>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleSale}
                    disabled={loading || selectedLotos.length === 0 || (Object.values(lotoEntries) as any[]).some((e: any) => e.numbers.some((n: string) => n.length < 2)) || totalAmount <= 0}
                    className="flex-1 bg-primary text-white py-6 rounded-2xl font-black text-xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <Zap size={24} />}
                    VENDRE & IMPRIMER
                  </button>
                  <button 
                    type="button"
                    className="bg-gray-100 text-gray-600 px-8 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    <Printer size={24} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <History className="text-primary" /> Ventes Récentes
            </h3>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Session: 12,450 HTG</div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                    <Ticket size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Florida Evening</div>
                    <div className="text-[10px] text-gray-400">Il y a 5 min • ID: #45892</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[10px]">12</span>
                  <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[10px]">55</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-gray-900">250 HTG</div>
                  <div className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Payé Cash</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="lg:col-span-1 space-y-8">
        <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <DollarSign className="text-accent" /> Encaissement Gains
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Scanner QR ou ID Billet..."
                className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            <button className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
              Vérifier le Billet
            </button>
          </div>
        </div>

        {lastTicket && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-primary relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-widest">Dernière Vente</div>
            <div className="text-center">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Reçu de Vente Officiel</div>
              <div className="text-2xl font-black text-gray-900 mb-1">{lastTicket.borlette}</div>
              <div className="text-xs text-gray-400 mb-6">{format(new Date(), 'PPP HH:mm', { locale: fr })}</div>
              
              <div className="space-y-4 mb-8 text-left">
                {Object.entries(lastTicket.entries).map(([loto, entry]: [string, any]) => (
                  <div key={loto} className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div className="text-[10px] font-bold text-primary uppercase mb-2">{loto}</div>
                    {entry.numbers.map((num: string, i: number) => (
                      <div key={i} className="flex items-center justify-between mb-1 last:mb-0">
                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-black">
                          {num}
                        </div>
                        <div className="text-xs font-black text-gray-900">
                          {entry.amounts[i]} HTG
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center py-4 border-y border-dashed border-gray-200 mb-6">
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Montant</div>
                  <div className="text-xl font-black text-gray-900">{lastTicket.amount} HTG</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Agent</div>
                  <div className="text-sm font-bold text-gray-900">#AG-882</div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-gray-400 break-all mb-6">
                ID: {lastTicket.id}
              </div>

              <button className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <Printer size={18} /> Réimprimer
              </button>
            </div>
          </motion.div>
        )}

        <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10">
          <h3 className="text-lg font-bold text-primary-dark mb-4 flex items-center gap-2">
            <UserPlus size={20} /> Nouveau Client ?
          </h3>
          <p className="text-primary/70 text-sm mb-6">Inscrivez le client pour qu'il puisse recevoir ses notifications de gains par SMS.</p>
          <button className="w-full bg-white text-primary border border-primary/20 py-3 rounded-xl font-bold hover:bg-primary/10 transition-colors">
            Créer un compte client
          </button>
        </div>
      </div>
    </div>
  );
}
