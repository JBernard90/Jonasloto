import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationToastProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

export default function NotificationToast({ notifications, removeNotification }: NotificationToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-4 max-w-sm w-full">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-slate-100 dark:border-dark-border p-4 flex gap-4 relative overflow-hidden group"
          >
            <div className={`w-1 h-full absolute left-0 top-0 ${
              notif.type === 'success' ? 'bg-green-500' : 
              notif.type === 'error' ? 'bg-accent' : 'bg-primary'
            }`} />
            
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              notif.type === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-500/10' : 
              notif.type === 'error' ? 'bg-accent/5 text-accent dark:bg-accent/10' : 
              'bg-primary/5 text-primary dark:bg-secondary/10 dark:text-secondary'
            }`}>
              {notif.type === 'success' ? <CheckCircle2 size={20} /> : 
               notif.type === 'error' ? <AlertCircle size={20} /> : 
               <Bell size={20} />}
            </div>

            <div className="flex-grow pr-6">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{notif.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{notif.message}</p>
            </div>

            <button 
              onClick={() => removeNotification(notif.id)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
