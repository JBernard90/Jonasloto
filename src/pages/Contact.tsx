import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, MessageSquare, Send, Globe, Facebook, Instagram, Twitter } from 'lucide-react';

export default function Contact() {
  const { t } = useTranslation();

  const contactMethods = [
    {
      icon: Phone,
      title: "Téléphone",
      value: "+509 2812-3456",
      desc: "Disponible du lundi au samedi, 8h - 18h",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      icon: Mail,
      title: "Email",
      value: "contact@jonasloto.com",
      desc: "Nous répondons sous 24 heures",
      color: "text-primary",
      bg: "bg-primary/5"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp",
      value: "+509 3712-3456",
      desc: "Support rapide par message",
      color: "text-green-600",
      bg: "bg-green-50"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Contactez-nous</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Une question sur un tirage, un problème avec votre compte ou vous souhaitez devenir agent ? Notre équipe est là pour vous aider.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contactMethods.map((method, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center"
          >
            <div className={`w-16 h-16 ${method.bg} ${method.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
              <method.icon size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{method.title}</h3>
            <p className="text-primary font-black mb-2">{method.value}</p>
            <p className="text-gray-400 text-xs">{method.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Envoyez-nous un message</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nom</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <input type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sujet</label>
              <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium appearance-none">
                <option>Support Technique</option>
                <option>Question sur les paiements</option>
                <option>Devenir Agent / Partenaire</option>
                <option>Autre</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Message</label>
              <textarea rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium resize-none"></textarea>
            </div>
            <button className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
              <Send size={18} /> Envoyer le message
            </button>
          </form>
        </div>

        {/* Info & Social */}
        <div className="space-y-8">
          <div className="bg-gray-900 text-white p-10 rounded-3xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-6 tracking-tight">Siège Social</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-accent shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-bold">Port-au-Prince, Haïti</p>
                    <p className="text-sm text-gray-400">123, Avenue Jean-Paul II, Turgeau</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-accent shrink-0">
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="font-bold">Présence Nationale</p>
                    <p className="text-sm text-gray-400">Plus de 500 agents à travers les 10 départements d'Haïti.</p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Suivez-nous</p>
                <div className="flex gap-4">
                  <a href="#" className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-primary transition-colors">
                    <Facebook size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-primary transition-colors">
                    <Instagram size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-primary transition-colors">
                    <Twitter size={20} />
                  </a>
                </div>
              </div>
            </div>
            {/* Abstract Background */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
          </div>

          <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Besoin d'aide immédiate ?</h3>
            <p className="text-gray-600 text-sm mb-4">Consultez notre foire aux questions pour des réponses rapides aux questions courantes.</p>
            <button className="text-primary font-bold text-sm hover:underline">Voir la FAQ &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
