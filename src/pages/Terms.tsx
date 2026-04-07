import React from 'react';
import { motion } from 'motion/react';
import { Shield, Scale, AlertTriangle, HelpCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/profile" className="inline-flex items-center gap-2 text-primary dark:text-secondary font-black uppercase tracking-widest text-xs mb-8 hover:gap-4 transition-all">
          <ChevronLeft size={16} /> Retour au profil
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 md:p-12 space-y-12"
        >
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-primary dark:text-secondary uppercase italic tracking-tighter leading-none mb-4">
              Conditions d'Utilisation
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Dernière mise à jour : 7 Avril 2026
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 dark:bg-secondary/5 dark:border-secondary/10">
              <Shield className="text-primary dark:text-secondary mb-4" size={32} />
              <h3 className="font-black text-slate-900 dark:text-white uppercase italic mb-2">Sécurité & Éligibilité</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Vous devez avoir au moins 18 ans. Une vérification d'identité (KYC) est obligatoire pour tous les retraits.
              </p>
            </div>
            <div className="p-6 bg-accent/5 rounded-3xl border border-accent/10">
              <AlertTriangle className="text-accent mb-4" size={32} />
              <h3 className="font-black text-slate-900 dark:text-white uppercase italic mb-2">Jeu Responsable</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Le jeu comporte des risques. Ne misez que ce que vous pouvez vous permettre de perdre.
              </p>
            </div>
          </div>

          <div className="space-y-8 text-slate-600 dark:text-slate-400">
            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-4 flex items-center gap-3">
                <Scale className="text-primary dark:text-secondary" /> 1. Acceptation des Conditions
              </h2>
              <p className="leading-relaxed">
                En accédant et en utilisant le site Jonas Loto Center (https://jonaslotocenter.vercel.app), vous acceptez d'être lié par ces conditions d'utilisation. Jonas Loto Center est une plateforme de jeux de loterie en ligne opérant depuis Haïti et destinée uniquement aux résidents haïtiens âgés de 18 ans ou plus.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-4 flex items-center gap-3">
                <CheckCircle2 className="text-primary dark:text-secondary" /> 2. Règles des Paris
              </h2>
              <div className="space-y-4">
                <p>Nous acceptons les types de paris suivants : Borlette (00-99), Loto 3, Loto 4, Loto 5 et Marriage.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Montant minimum par pari : 10 HTG</li>
                  <li>Montant maximum par pari : 100,000 HTG</li>
                  <li>Les paris confirmés ne peuvent être annulés ou modifiés.</li>
                  <li>Les résultats des tirages sont basés sur les loteries officielles de New York, Florida et Georgia.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-4">3. Calcul des Gains</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-dark-border">
                      <th className="py-3 font-black uppercase tracking-widest">Type</th>
                      <th className="py-3 font-black uppercase tracking-widest">Mise</th>
                      <th className="py-3 font-black uppercase tracking-widest">Gain (si correct)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-dark-border">
                    <tr><td className="py-3">Borlette</td><td className="py-3">100 HTG</td><td className="py-3 font-bold text-green-600">400 HTG</td></tr>
                    <tr><td className="py-3">Loto 3</td><td className="py-3">100 HTG</td><td className="py-3 font-bold text-green-600">600 HTG</td></tr>
                    <tr><td className="py-3">Loto 4</td><td className="py-3">100 HTG</td><td className="py-3 font-bold text-green-600">4,000 HTG</td></tr>
                    <tr><td className="py-3">Loto 5</td><td className="py-3">100 HTG</td><td className="py-3 font-bold text-green-600">10,000 HTG</td></tr>
                    <tr><td className="py-3">Marriage</td><td className="py-3">100 HTG</td><td className="py-3 font-bold text-green-600">1,600 HTG</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-4">4. Retrait des Gains</h2>
              <p className="leading-relaxed">
                Les retraits sont effectués via MonCash ou NatCash dans un délai de 48 heures après validation. Le minimum de retrait est de 500 HTG. Les gains non réclamés après 90 jours seront annulés conformément aux pratiques locales.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-4">5. Conformité Juridique (Haïti)</h2>
              <p className="leading-relaxed">
                Jonas Loto Center opère en conformité avec les lois haïtiennes régissant les jeux de hasard. Tous les utilisateurs acceptent de ne pas utiliser le service pour le blanchiment d'argent. Les paris sportifs sont actuellement interdits sur notre plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-4 flex items-center gap-3">
                <HelpCircle className="text-primary dark:text-secondary" /> 6. Contact & Support
              </h2>
              <p className="leading-relaxed">
                Pour toute question ou litige, contactez notre support à <strong>contact@jonasloto.com</strong> ou via notre hotline au <strong>+509 1234 5678</strong>. Nous nous engageons à répondre sous 5 jours ouvrables.
              </p>
            </section>
          </div>

          <div className="pt-12 border-t border-slate-100 dark:border-dark-border text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              &copy; 2026 Jonas Loto Center. Tous droits réservés.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
