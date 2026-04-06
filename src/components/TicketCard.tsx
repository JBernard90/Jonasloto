import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, Clock, MapPin } from 'lucide-react';

interface TicketCardProps {
  ticket: {
    id: string;
    borlette: string;
    lotos: string[];
    entries: any;
    amount: number;
    status: string;
    created_at: string;
  };
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const qrData = JSON.stringify({
    id: ticket.id,
    borlette: ticket.borlette,
    amount: ticket.amount,
    date: ticket.created_at
  });

  return (
    <div className="card p-0 overflow-hidden border-l-8 border-primary dark:border-secondary">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary dark:text-secondary font-black uppercase italic tracking-tighter text-xl mb-1">
              <Ticket size={20} /> {ticket.borlette}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              ID: #{ticket.id.slice(0, 8)}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
            ticket.status === 'active' ? 'bg-green-50 text-green-600 dark:bg-green-500/10' : 'bg-slate-50 text-slate-400 dark:bg-dark-bg'
          }`}>
            {ticket.status}
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {Object.entries(ticket.entries).map(([loto, entry]: [string, any]) => (
            <div key={loto} className="bg-slate-50 dark:bg-dark-bg p-3 rounded-xl border border-slate-100 dark:border-dark-border">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{loto}</div>
              <div className="flex flex-wrap gap-2">
                {entry.numbers.map((num: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-white dark:bg-dark-surface rounded-lg flex items-center justify-center font-black text-primary dark:text-secondary shadow-sm text-xs border border-slate-100 dark:border-dark-border">
                      {num}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{entry.amounts[idx]} HTG</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-dashed border-slate-200 dark:border-dark-border">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm dark:bg-white">
              <QRCodeSVG value={qrData} size={64} level="H" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Mise</div>
              <div className="text-xl font-black text-primary dark:text-secondary">{ticket.amount.toLocaleString()} HTG</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
