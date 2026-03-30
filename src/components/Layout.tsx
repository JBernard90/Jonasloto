import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User } from '@supabase/supabase-js';
import { 
  Home, 
  Trophy, 
  Ticket, 
  User as UserIcon, 
  Settings, 
  Monitor,
  LogOut,
  Globe,
  ShieldCheck,
  Menu
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  role: string | null;
}

export default function Layout({ children, user, role }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  const navItems = [
    { path: '/', label: t('home'), icon: Home },
    { path: '/results', label: t('results'), icon: Trophy },
  ];

  if (!user || role === 'client' || role === 'admin') {
    navItems.push({ path: '/buy', label: t('buy'), icon: Ticket });
  }

  if (role === 'agent' || role === 'admin') {
    navItems.push({ path: '/pos', label: t('pos'), icon: Monitor });
  }

  if (role === 'supervisor' || role === 'admin') {
    navItems.push({ path: '/supervisor', label: t('supervisor'), icon: ShieldCheck });
  }

  if (role === 'admin') {
    navItems.push({ path: '/admin', label: t('admin'), icon: Settings });
  }

  navItems.push({ path: '/contact', label: t('contact'), icon: Globe });

  if (user) {
    navItems.push({ path: '/profile', label: t('profile'), icon: UserIcon });
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg sticky top-0 z-50 border-b-4 border-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link to="/" className="group">
                <Logo />
              </Link>
            </div>

            {/* Desktop/Tablet Nav */}
            <nav className="hidden md:flex space-x-2 lg:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-md text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all ${
                    location.pathname === item.path 
                      ? 'bg-secondary text-primary shadow-inner' 
                      : 'text-white/80 hover:bg-primary-light hover:text-white'
                  }`}
                >
                  <item.icon size={14} className="lg:w-4 lg:h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button className="md:hidden p-2 text-white/80 hover:text-white">
                <Menu size={20} />
              </button>

              {/* Language Switcher */}
              <div className="flex items-center bg-primary-dark rounded-full px-2 py-1 border border-white/10">
                <Globe size={14} className="text-secondary mr-1" />
                <select 
                  onChange={(e) => changeLanguage(e.target.value)}
                  value={i18n.language}
                  className="bg-transparent text-[10px] font-black focus:outline-none cursor-pointer appearance-none pr-1"
                >
                  <option value="fr" className="text-black">FR</option>
                  <option value="ht" className="text-black">KR</option>
                  <option value="en" className="text-black">EN</option>
                </select>
              </div>

              {user ? (
                <div className="flex items-center gap-2">
                  {role && (
                    <span className="hidden sm:block px-2 py-0.5 bg-secondary text-primary text-[9px] font-black uppercase tracking-widest rounded border border-primary/20">
                      {t(`role_${role}`)}
                    </span>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="p-2 hover:bg-primary-light rounded-full transition-colors text-white/80 hover:text-white"
                    title={t('logout')}
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/profile" 
                  className="bg-secondary text-primary px-4 py-1.5 rounded font-black text-xs uppercase tracking-wider hover:bg-white transition-all shadow-md active:scale-95"
                >
                  {t('login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              location.pathname === item.path 
                ? 'text-primary' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon size={20} className={location.pathname === item.path ? 'text-primary' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-1 sm:col-span-2">
              <Link to="/" className="mb-4 inline-block">
                <Logo light />
              </Link>
              <p className="text-sm leading-relaxed max-w-sm">
                La plateforme de loterie multicanal leader en Haïti. Sécurité, transparence et accessibilité pour tous les joueurs.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">{t('rules')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/rules" className="hover:text-secondary transition-colors">{t('terms_of_use')}</Link></li>
                <li><Link to="/rules" className="hover:text-secondary transition-colors">{t('responsible_gaming')}</Link></li>
                <li><Link to="/contact" className="hover:text-secondary transition-colors">{t('contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">{t('become_agent')}</h3>
              <p className="text-xs mb-4 leading-relaxed">{t('become_agent_desc')}</p>
              <Link to="/contact" className="inline-block bg-primary text-white border border-secondary/50 px-4 py-2 rounded text-xs font-bold hover:bg-primary-light transition-colors">
                {t('contact_us')}
              </Link>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Paiements</h3>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-800 px-2 py-1 rounded text-[10px] font-bold">MONCASH</span>
                <span className="bg-gray-800 px-2 py-1 rounded text-[10px] font-bold">NATCASH</span>
                <span className="bg-gray-800 px-2 py-1 rounded text-[10px] font-bold">LAJAN CASH</span>
                <span className="bg-gray-800 px-2 py-1 rounded text-[10px] font-bold">CASH</span>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs">
            &copy; {new Date().getFullYear()} Jonas Loto. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
