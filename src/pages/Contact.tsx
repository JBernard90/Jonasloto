import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Mail, Phone, MapPin, Send, 
  CheckCircle2, AlertCircle, Globe,
  MessageSquare, HelpCircle, ArrowRight
} from 'lucide-react';
import Logo from '../components/Logo';

export default function Contact() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate sending message
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter mb-2">
          {t('contact')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Une question ? Une suggestion ? Nous sommes à votre écoute.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="card p-8 md:p-10 space-y-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-6 flex items-center gap-2">
              <MessageSquare className="text-primary dark:text-secondary" /> Envoyez-nous un message
            </h2>

            {success ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto dark:bg-green-500/10">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Message Envoyé !</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.</p>
                </div>
                <button onClick={() => setSuccess(false)} className="btn-primary px-8">
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom Complet</label>
                    <input type="text" required className="input-field" placeholder="Votre nom..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                    <input type="email" required className="input-field" placeholder="votre@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sujet</label>
                  <input type="text" required className="input-field" placeholder="Sujet de votre message..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message</label>
                  <textarea required rows={5} className="input-field resize-none" placeholder="Comment pouvons-nous vous aider ?"></textarea>
                </div>

                {error && (
                  <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl flex items-center gap-3 text-accent text-xs font-bold">
                    <AlertCircle size={18} /> {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={20} /> Envoyer le message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="card bg-primary text-white dark:bg-black border-none p-10 space-y-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Informations de Contact</h2>
              <p className="text-slate-400 font-medium">Retrouvez-nous ou contactez-nous directement via ces canaux.</p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-secondary shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-secondary mb-1">Notre Siège</h4>
                  <p className="text-slate-300 font-medium">123 Rue des Miracles, Port-au-Prince, Haïti</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-secondary shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-secondary mb-1">Téléphone</h4>
                  <p className="text-slate-300 font-medium">+509 1234 5678</p>
                  <p className="text-slate-300 font-medium">+509 8765 4321</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-secondary shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-secondary mb-1">E-mail</h4>
                  <p className="text-slate-300 font-medium">contact@jonaslotocenter.com</p>
                  <p className="text-slate-300 font-medium">support@jonaslotocenter.com</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-secondary shrink-0">
                  <Globe size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-secondary mb-1">Réseaux Sociaux</h4>
                  <div className="flex gap-4 mt-2">
                    <a href="#" className="text-slate-300 hover:text-secondary transition-colors">Facebook</a>
                    <a href="#" className="text-slate-300 hover:text-secondary transition-colors">Instagram</a>
                    <a href="#" className="text-slate-300 hover:text-secondary transition-colors">Twitter</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-8 bg-slate-50 dark:bg-dark-surface border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center dark:bg-secondary/5 dark:text-secondary">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Besoin d'aide ?</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Consultez nos règles du jeu et notre foire aux questions pour des réponses rapides.</p>
            <button className="text-primary dark:text-secondary font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:gap-3 transition-all">
              Voir les règles <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
