import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LOTTERY_CONFIG } from '../constants/lottery';

export default function BuyTicket({ user }: { user: any }) {
  const { t } = useTranslation();
  const [selectedLottery, setSelectedLottery] = useState('');
  const [numbers, setNumbers] = useState(['', '', '']);
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
          <AlertCircle size={48} className="mx-auto text-accent mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Connexion requise</h1>
          <p className="text-gray-500 mb-6">Veuillez vous connecter pour acheter un billet.</p>
          <a href="/profile" className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors">
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!selectedLottery || numbers.some(n => !n)) {
        throw new Error('Veuillez remplir tous les champs');
      }

      const { error } = await supabase
        .from('tickets')
        .insert({
          userId: user.id,
          lottery: selectedLottery,
          numbers,
          amount,
          status: 'pending',
          createdAt: new Date().toISOString()
        });

      if (error) throw error;

      setSuccess(true);
      setSelectedLottery('');
      setNumbers(['', '', '']);
      setAmount(100);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const lotteries = Object.keys(LOTTERY_CONFIG);

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart size={32} className="text-primary" />
          <div>
            <h1 className="text-2xl font-black text-gray-900">Acheter un Billet</h1>
            <p className="text-gray-500 text-sm">Choisissez votre loterie et vos numéros</p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 size={24} className="text-green-600" />
            <div>
              <p className="text-green-900 font-bold">Billet acheté avec succès!</p>
              <p className="text-green-700 text-sm">Votre billet a été créé. Attendez le prochain tirage!</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleBuy} className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
              Sélectionner une Loterie
            </label>
            <select
              value={selectedLottery}
              onChange={(e) => setSelectedLottery(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              required
            >
              <option value="">Choisir une loterie...</option>
              {lotteries.map(lottery => (
                <option key={lottery} value={lottery}>{lottery}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
              Vos Numéros (3 chiffres)
            </label>
            <div className="grid grid-cols-3 gap-4">
              {numbers.map((num, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={2}
                  value={num}
                  onChange={(e) => {
                    const newNumbers = [...numbers];
                    newNumbers[idx] = e.target.value.replace(/\D/g, '');
                    setNumbers(newNumbers);
                  }}
                  className="w-full px-4 py-3 text-center text-2xl font-black bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="00"
                  required
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
              Montant (HTG)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-bold"
              min="100"
              step="100"
              required
            />
            <p className="text-[10px] text-gray-400 mt-2">Minimum: 100 HTG</p>
          </div>

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Montant du billet</span>
              <span className="text-2xl font-black text-primary">{amount.toLocaleString()} HTG</span>
            </div>
            <p className="text-[10px] text-gray-400">Frais de service inclus</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 uppercase tracking-wider"
          >
            {loading ? 'Traitement...' : 'Acheter le Billet'}
          </button>
        </form>

        <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <h3 className="font-black text-gray-900 mb-4">Comment ça marche?</h3>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="font-black text-primary shrink-0">1.</span>
              <span>Choisissez votre loterie préférée</span>
            </li>
            <li className="flex gap-3">
              <span className="font-black text-primary shrink-0">2.</span>
              <span>Sélectionnez 3 numéros (00-99)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-black text-primary shrink-0">3.</span>
              <span>Définissez votre mise</span>
            </li>
            <li className="flex gap-3">
              <span className="font-black text-primary shrink-0">4.</span>
              <span>Attendez le tirage et gagnez!</span>
            </li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
}
