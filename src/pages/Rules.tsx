import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Scale, Heart, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Rules() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Règles & Conditions</h1>
        <p className="text-gray-500">Transparence et équité pour tous nos joueurs.</p>
      </section>

      <div className="space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <Scale size={24} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Conditions d'Utilisation</h2>
          </div>
          <div className="prose prose-primary max-w-none text-gray-600 space-y-4">
            <p>
              En utilisant la plateforme Jonas Loto, vous acceptez de vous conformer aux conditions suivantes :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Vous devez être âgé d'au moins 18 ans pour participer à nos jeux.</li>
              <li>Toutes les transactions sont finales et non remboursables une fois le tirage effectué.</li>
              <li>Les gains sont payés selon les cotes officielles en vigueur au moment de l'achat.</li>
              <li>L'utilisation de comptes multiples ou de méthodes frauduleuses entraînera une suspension immédiate.</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
              <Heart size={24} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Jeu Responsable</h2>
          </div>
          <div className="prose prose-green max-w-none text-gray-600 space-y-4">
            <p>
              La loterie doit rester un divertissement. Nous encourageons nos joueurs à jouer de manière responsable :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Ne jouez jamais plus que ce que vous pouvez vous permettre de perdre.</li>
              <li>Fixez-vous des limites de temps et de budget.</li>
              <li>Si vous sentez que le jeu devient un problème, utilisez notre option de suspension de compte.</li>
              <li>Contactez notre support pour obtenir de l'aide ou des ressources sur l'addiction au jeu.</li>
            </ul>
          </div>
        </div>

        <div className="bg-primary text-white p-8 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Shield size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Sécurité des Tirages</h2>
          </div>
          <p className="mb-6 opacity-90">
            Tous nos tirages sont basés sur les résultats officiels des loteries d'État (New York, Florida, Georgia) ou générés par des systèmes certifiés garantissant un hasard total.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded-xl flex items-center gap-3">
              <CheckCircle size={20} className="text-secondary" />
              <span className="text-sm font-bold">Résultats vérifiables</span>
            </div>
            <div className="bg-white/10 p-4 rounded-xl flex items-center gap-3">
              <CheckCircle size={20} className="text-secondary" />
              <span className="text-sm font-bold">Paiements garantis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
