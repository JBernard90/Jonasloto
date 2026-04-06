import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Menu, X, Sun, Moon, User, LogOut, 
  Home, Ticket, History, Shield, LayoutDashboard, 
  Settings, HelpCircle, Mail, Phone, MapPin, 
  Facebook, Twitter, Instagram, Youtube, Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  role?: string | null;
}

export default function Layout({ children, user: initialUser, role: initialRole }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [user, setUser] = useState<any>(initialUser || null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    setUser(initialUser);
    if (initialUser) fetchUserData(initialUser.id);
    else setUserData(null);
  }, [initialUser]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!initialUser) {
        setUser(session?.user ?? null);
        if (session?.user) fetchUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!initialUser) {
        setUser(session?.user ?? null);
        if (session?.user) fetchUserData(session.user.id);
        else setUserData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [initialUser]);

  const fetchUserData = async (uid: string) => {
    const { data } = await supabase.from('users').select('*').eq('uid', uid).single();
    if (data) setUserData(data);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleLanguage = () => {
    const langs = ['fr', 'en', 'ht'];
    const currentIdx = langs.indexOf(i18n.language.split('-')[0]);
    const nextLang = langs[(currentIdx + 1) % langs.length];
    i18n.changeLanguage(nextLang);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navLinks = [
    { name: t('home'), path: '/', icon: Home },
    { name: t('buy_ticket'), path: '/buy-ticket', icon: Ticket },
    { name: t('results'), path: '/results', icon: History },
    { name: t('rules'), path: '/rules', icon: HelpCircle },
    { name: t('contact'), path: '/contact', icon: Mail },
  ];

  const roleLinks = {
    admin: { name: t('admin'), path: '/admin', icon: Shield },
    supervisor: { name: t('supervisor'), path: '/supervisor', icon: LayoutDashboard },
    agent: { name: t('pos'), path: '/pos', icon: Settings },
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 dark:bg-dark-surface/80 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center py-1">
                <Logo className="w-48 h-20" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                    location.pathname === link.path 
                      ? 'text-primary bg-primary/5 dark:text-secondary dark:bg-secondary/5' 
                      : 'text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-secondary'
                  }`}
                >
                  <link.icon size={18} />
                  {link.name}
                </Link>
              ))}

              {userData?.role && roleLinks[userData.role as keyof typeof roleLinks] && (
                <Link
                  to={roleLinks[userData.role as keyof typeof roleLinks].path}
                  className="px-3 py-2 rounded-xl text-sm font-bold text-accent bg-accent/5 hover:bg-accent/10 transition-all flex items-center gap-2"
                >
                  {React.createElement(roleLinks[userData.role as keyof typeof roleLinks].icon, { size: 18 })}
                  {roleLinks[userData.role as keyof typeof roleLinks].name}
                </Link>
              )}

              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-100 dark:border-dark-border">
                <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-bg text-slate-500 dark:text-slate-400 transition-all">
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={toggleLanguage} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-bg text-slate-500 dark:text-slate-400 transition-all flex items-center gap-1 font-bold text-xs uppercase">
                  <Globe size={18} /> {i18n.language.split('-')[0]}
                </button>
                
                {user ? (
                  <div className="flex items-center gap-2">
                    <Link to="/profile" className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 dark:bg-secondary/5 dark:text-secondary transition-all">
                      <User size={20} />
                    </Link>
                    <button onClick={handleLogout} className="p-2 rounded-xl bg-accent/5 text-accent hover:bg-accent/10 transition-all">
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <Link to="/profile" className="btn-primary py-2 px-4 text-xs">
                    {t('login')}
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-500 dark:text-slate-400">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-xl text-slate-500 dark:text-slate-400">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 dark:bg-dark-surface dark:border-dark-border overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-base font-bold text-slate-600 hover:text-primary hover:bg-primary/5 dark:text-slate-300 dark:hover:text-secondary dark:hover:bg-secondary/5"
                  >
                    <div className="flex items-center gap-3">
                      <link.icon size={20} />
                      {link.name}
                    </div>
                  </Link>
                ))}
                
                {userData?.role && roleLinks[userData.role as keyof typeof roleLinks] && (
                  <Link
                    to={roleLinks[userData.role as keyof typeof roleLinks].path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-base font-bold text-accent bg-accent/5"
                  >
                    <div className="flex items-center gap-3">
                      {React.createElement(roleLinks[userData.role as keyof typeof roleLinks].icon, { size: 20 })}
                      {roleLinks[userData.role as keyof typeof roleLinks].name}
                    </div>
                  </Link>
                )}

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
                  <button onClick={toggleLanguage} className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <Globe size={20} /> {i18n.language.split('-')[0]}
                  </button>
                  {user ? (
                    <div className="flex gap-2">
                      <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="btn-primary py-2 px-4 text-xs">
                        {t('profile')}
                      </Link>
                      <button onClick={handleLogout} className="bg-accent/5 text-accent px-4 py-2 rounded-xl text-xs font-bold">
                        {t('logout')}
                      </button>
                    </div>
                  ) : (
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="btn-primary py-2 px-4 text-xs">
                      {t('login')}
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <Link to="/" className="flex flex-col items-start mb-6">
                <Logo className="w-48 h-24 -ml-4" />
              </Link>
              <p className="text-sm leading-relaxed text-slate-400 mb-6">
                {t('hero_subtitle')}
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-slate-800 rounded-lg hover:text-secondary transition-colors"><Facebook size={18} /></a>
                <a href="#" className="p-2 bg-slate-800 rounded-lg hover:text-secondary transition-colors"><Twitter size={18} /></a>
                <a href="#" className="p-2 bg-slate-800 rounded-lg hover:text-secondary transition-colors"><Instagram size={18} /></a>
                <a href="#" className="p-2 bg-slate-800 rounded-lg hover:text-secondary transition-colors"><Youtube size={18} /></a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Navigation</h4>
              <ul className="space-y-4 text-sm">
                {navLinks.map(link => (
                  <li key={link.path}><Link to={link.path} className="hover:text-secondary transition-colors">{link.name}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Contact</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3"><Phone size={16} className="text-secondary" /> +509 1234 5678</li>
                <li className="flex items-center gap-3"><Mail size={16} className="text-secondary" /> contact@jonasloto.com</li>
                <li className="flex items-center gap-3"><MapPin size={16} className="text-secondary" /> Port-au-Prince, Haïti</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Newsletter</h4>
              <p className="text-xs text-slate-400 mb-4">Inscrivez-vous pour recevoir les résultats des tirages par e-mail.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Votre e-mail" className="bg-slate-800 border-none rounded-lg px-4 py-2 text-xs w-full focus:ring-1 focus:ring-secondary" />
                <button className="bg-secondary text-primary p-2 rounded-lg hover:bg-secondary-dark transition-colors"><Mail size={18} /></button>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            <p>&copy; 2026 JONAS LOTO CENTER. Tous droits réservés. Jouez de manière responsable.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
