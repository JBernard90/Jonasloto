import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  BookOpen, ShieldCheck, AlertCircle, 
  CheckCircle2, Info, ArrowRight,
  Zap, History, Star, TrendingUp
} from 'lucide-react';

export default function Rules() {
  const { t } = useTranslation();

  const rules = [
    {
      title: "Comment Jouer",
      icon: <Zap className="text-primary dark:text-secondary" />,
      content: "Pour participer, vous devez créer un compte et avoir un solde suffisant. Choisissez votre borlette (New York, Florida, Georgia) et sélectionnez vos numéros pour les différents types de lotos (Borlette, Loto 3, Loto 4, Loto 5, Marriage)."
    },
    {
      title: "Types de Paris",
      icon: <Star className="text-accent" />,
      content: "Borlette (2 chiffres), Loto 3 (3 chiffres), Loto 4 (4 chiffres), Loto 5 (5 chiffres) et Marriage (2 paires de 2 chiffres). Chaque type de pari a ses propres probabilités et gains potentiels."
    },
    {
      title: "Gains et Paiements",
      icon: <TrendingUp className="text-green-500" />,
      content: "Les gains sont calculés en fonction du montant misé et du type de loto. Les paiements sont crédités automatiquement sur votre portefeuille Jonas Loto Center après la validation officielle des résultats."
    },
    {
      title: "Sécurité et Équité",
      icon: <ShieldCheck className="text-primary dark:text-secondary" />,
      content: "Toutes les transactions sont sécurisées et cryptées. Les tirages sont basés sur les résultats officiels des loteries internationales pour garantir une équité totale à tous nos joueurs."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter mb-2">
          {t('rules')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Tout ce que vous devez savoir pour jouer en toute sécurité.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {rules.map((rule, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 dark:bg-dark-bg">
              {rule.icon}
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{rule.title}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{rule.content}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card bg-slate-900 text-white border-none p-10 space-y-8 dark:bg-black">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-secondary">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Conditions Importantes</h2>
        </div>
        
        <ul className="space-y-4">
          <li className="flex items-start gap-4 text-slate-300 font-medium">
            <CheckCircle2 className="text-secondary shrink-0 mt-1" size={18} />
            L'âge minimum pour jouer est de 18 ans.
          </li>
          <li className="flex items-start gap-4 text-slate-300 font-medium">
            <CheckCircle2 className="text-secondary shrink-0 mt-1" size={18} />
            Les paris ne peuvent pas être annulés une fois confirmés.
          </li>
          <li className="flex items-start gap-4 text-slate-300 font-medium">
            <CheckCircle2 className="text-secondary shrink-0 mt-1" size={18} />
            Tout comportement frauduleux entraînera la suspension immédiate du compte.
          </li>
          <li className="flex items-start gap-4 text-slate-300 font-medium">
            <CheckCircle2 className="text-secondary shrink-0 mt-1" size={18} />
            Les gains non réclamés après 90 jours seront annulés.
          </li>
        </ul>
      </div>

      <div className="text-center pt-8">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Prêt à tenter votre chance ?</p>
        <button className="btn-primary px-12 py-4 text-lg">
          Jouer Maintenant
        </button>
      </div>
    </div>
  );
}
