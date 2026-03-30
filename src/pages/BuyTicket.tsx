import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Dices,
  QrCode,
  Wallet,
  Zap
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LOTTERY_CONFIG, LOTO_DIGITS } from '../constants/lottery';

interface BuyTicketProps {
  user: any;
}

export default function BuyTicket({ user }: BuyTicketProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [borlette, setBorlette] = useState('');
  const [selectedLotos, setSelectedLotos] = useState<string[]>([]);
  const [lotoEntries, setLotoEntries] = useState<Record<string, { numbers: string[], amounts: number[] }>>({});
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    if (user) {
      supabase
        .from('users')
        .select('balance, phoneNumber')
        .eq('uid', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserBalance(data.balance || 0);
            setPhoneNumber(data.phoneNumber || '');
          }
        });
    }
  }, [user]);

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

  const handleSendOTP = async () => {
    if (!user) return;
    setOtpLoading(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      await supabase.from('otps').insert({
        userId: user.id,
        code,
        type: 'purchase',
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      });

      console.log(`[DEMO] OTP Code for ${phoneNumber}: ${code}`);
      setOtpSent(true);
    } catch (error) {
      console.error("OTP Send error:", error);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!user) return;
    setOtpLoading(true);
    try {
      const { data, error } = await supabase
        .from('otps')
        .select('*')
        .eq('userId', user.id)
        .eq('code', otpCode)
        .eq('status', 'pending')
        .single();
      
      if (error || !data) {
        alert(t('invalid_otp'));
        return;
      }

      if (new Date(data.expiresAt) < new Date()) {
        alert(t('invalid_otp'));
        return;
      }

      await supabase.from('otps').update({ status: 'used' }).eq('id', data.id);
      handlePayment();
    } catch (error) {
      console.error("OTP Verify error:", error);
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      let paymentSuccess = false;
      let transactionId = '';

      if (paymentMethod === 'Wallet') {
        if (userBalance < totalAmount) {
          alert(t('insufficient_balance'));
          setLoading(false);
          return;
        }
        const newBalance = userBalance - totalAmount;
        await supabase.from('users').update({ balance: newBalance }).eq('uid', user.id);
        setUserBalance(newBalance);
        paymentSuccess = true;
        transactionId = `WLT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      } else {
        const response = await fetch('/api/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: paymentMethod, amount: totalAmount, phoneNumber })
        });
        const data = await response.json();
        paymentSuccess = data.success;
        transactionId = data.transactionId;
      }

      if (paymentSuccess) {
        const ticketData = {
          userId: user.id,
          borlette,
          lotos: selectedLotos,
          entries: lotoEntries,
          amount: totalAmount,
          status: 'active',
          type: 'digital',
          paymentMethod,
          paymentReference: transactionId,
          createdAt: new Date().toISOString()
        };
        
        const { data, error } = await supabase.from('tickets').insert(ticketData).select().single();
        if (data) {
          setTicketId(data.id);
          setStep(5);
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
        <AlertCircle size={64} className="text-accent mb-6" />
        <h2 className="text-2xl font-bold mb-2">Connexion requise</h2>
        <p className="text-gray-500 mb-8">Vous devez être connecté pour acheter un billet en ligne.</p>
        <button className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-colors">
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${((step - 1) / 4) * 100}%` }}
        ></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i}
            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
              step >= i ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white text-gray-400 border-2 border-gray-200'
            }`}
          >
            {step > i ? <CheckCircle2 size={20} /> : i}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
          >
            <h2 className="text-2xl font-black mb-6 tracking-tight">Choisissez votre Borlette</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {borletteTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleBorletteSelect(type)}
                  className={`p-6 rounded-2xl border-2 transition-all text-left group ${
                    borlette === type ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/20'
                  }`}
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
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight">Lotos pour {borlette}</h2>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Borlette unique: {borlette}</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {LOTTERY_CONFIG[borlette].map((loto) => (
                <button
                  key={loto}
                  onClick={() => toggleLoto(loto)}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    selectedLotos.includes(loto) ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-100 hover:border-primary/20 bg-white text-gray-600'
                  }`}
                >
                  <div className="font-black">{loto}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-600">
                <ChevronLeft size={20} /> Retour
              </button>
              <button 
                onClick={() => setStep(3)} 
                disabled={selectedLotos.length === 0}
                className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
          >
            <h2 className="text-2xl font-black mb-6 tracking-tight">Saisie des numéros</h2>
            
            <div className="space-y-8 mb-8">
              {selectedLotos.map((loto) => (
                <div key={loto} className="border-b border-gray-100 pb-6 last:border-0">
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
                      <div key={idx} className="flex flex-col md:flex-row md:items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex-shrink-0">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Numéro ({LOTO_DIGITS[loto]} ch.)</label>
                          <input
                            type="text"
                            maxLength={LOTO_DIGITS[loto]}
                            value={num}
                            onChange={(e) => updateLotoEntry(loto, idx, 'numbers', e.target.value)}
                            className="w-20 h-12 text-center text-xl font-black bg-white border-2 border-gray-100 rounded-xl focus:border-primary focus:outline-none transition-all"
                            placeholder={"0".repeat(LOTO_DIGITS[loto])}
                          />
                        </div>
                        <div className="flex-grow">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mise (HTG)</label>
                          <div className="flex flex-wrap gap-2">
                            {[5, 11, 15, 17, 25, 50].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => updateLotoEntry(loto, idx, 'amounts', val)}
                                className={`px-3 py-2 rounded-lg border font-bold text-xs transition-all ${
                                  lotoEntries[loto].amounts[idx] === val ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-primary/20'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                placeholder="HTG"
                                value={lotoEntries[loto].amounts[idx] || ''}
                                onChange={(e) => updateLotoEntry(loto, idx, 'amounts', e.target.value)}
                                className="w-20 py-2 px-2 bg-white border border-gray-200 rounded-lg text-center font-bold text-xs focus:border-primary focus:outline-none"
                              />
                            </div>
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

            <div className="mb-8 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center">
              <span className="text-sm font-bold text-primary-dark uppercase tracking-widest">Total à payer</span>
              <span className="text-2xl font-black text-primary">{totalAmount} HTG</span>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-600">
                <ChevronLeft size={20} /> Retour
              </button>
              <button 
                onClick={() => setStep(4)} 
                disabled={(Object.values(lotoEntries) as any[]).some((e: any) => e.numbers.some((n: string) => n.length < 2)) || totalAmount <= 0}
                className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
          >
            <h2 className="text-2xl font-black mb-6 tracking-tight">Méthode de paiement</h2>
            <div className="space-y-4 mb-8">
              <button
                onClick={() => setPaymentMethod('Wallet')}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  paymentMethod === 'Wallet' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center">
                    <Wallet className="text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-900">{t('pay_with_wallet')}</div>
                    <div className="text-xs text-gray-400">Solde actuel: <span className="font-bold text-primary">{userBalance} HTG</span></div>
                  </div>
                </div>
                {paymentMethod === 'Wallet' && <CheckCircle2 className="text-primary" />}
              </button>

              {['MonCash', 'NatCash', 'Lajan Cash'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    paymentMethod === method ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center">
                      <Smartphone className="text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-gray-900">{method}</div>
                      <div className="text-xs text-gray-400">Paiement mobile sécurisé</div>
                    </div>
                  </div>
                  {paymentMethod === method && <CheckCircle2 className="text-primary" />}
                </button>
              ))}
            </div>

            {paymentMethod && paymentMethod !== 'Wallet' && (
              <div className="mb-8 animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Numéro de téléphone {paymentMethod}</label>
                <input 
                  type="tel"
                  placeholder="3XXX-XXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary focus:outline-none font-bold"
                />
              </div>
            )}

            {otpSent && (
              <div className="mb-8 animate-in fade-in slide-in-from-top-2">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-4">
                  <p className="text-sm text-primary-dark font-medium">{t('otp_sent')}</p>
                </div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('enter_otp')}</label>
                <input 
                  type="text"
                  maxLength={6}
                  placeholder="XXXXXX"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary focus:outline-none font-black text-center text-2xl tracking-widest"
                />
                <button 
                  onClick={handleSendOTP}
                  className="text-primary text-xs font-bold mt-2 hover:underline"
                >
                  {t('resend_otp')}
                </button>
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-600">
                <ChevronLeft size={20} /> Retour
              </button>
              
              {!otpSent ? (
                <button 
                  onClick={handleSendOTP}
                  disabled={!paymentMethod || (paymentMethod !== 'Wallet' && !phoneNumber) || otpLoading}
                  className="bg-primary text-white px-10 py-3 rounded-full font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {otpLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Zap size={20} />}
                  {t('pay')} {totalAmount} HTG
                </button>
              ) : (
                <button 
                  onClick={handleVerifyOTP}
                  disabled={otpCode.length < 6 || otpLoading || loading}
                  className="bg-primary text-white px-10 py-3 rounded-full font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading || otpLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle2 size={20} />}
                  {t('confirm_purchase')}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 text-center"
          >
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">Achat réussi !</h2>
            <p className="text-gray-500 mb-8">Votre billet a été enregistré avec succès. Bonne chance !</p>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 inline-block min-w-[300px]">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Billet Électronique</div>
              <div className="bg-white p-4 rounded-xl shadow-inner mb-4">
                <QRCodeSVG value={ticketId} size={150} />
              </div>
              <div className="text-lg font-black text-gray-900 mb-1">{borlette}</div>
              <div className="flex flex-col gap-3 mb-4">
                {Object.entries(lotoEntries).map(([loto, entry]: [string, any]) => (
                  <div key={loto} className="text-left">
                    <div className="text-[10px] font-bold text-primary uppercase mb-1">{loto}</div>
                    {entry.numbers.map((num: string, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-100 mb-1">
                        <span className="bg-primary text-white px-2 py-1 rounded-lg font-bold text-sm">{num}</span>
                        <span className="text-sm font-black text-gray-900">{entry.amounts[i]} HTG</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                <span className="text-lg font-black text-primary">{totalAmount} HTG</span>
              </div>
              <div className="text-[10px] font-mono text-gray-400">ID: {ticketId}</div>
            </div>

            <div className="flex flex-col gap-4">
              <button className="text-primary font-bold hover:underline flex items-center justify-center gap-2">
                <Smartphone size={18} /> Enregistrer sur mon téléphone
              </button>
              <button 
                onClick={() => {
                  setBorlette('');
                  setSelectedLotos([]);
                  setLotoEntries({});
                  setStep(1);
                }}
                className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors"
              >
                Acheter un autre billet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
