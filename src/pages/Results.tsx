import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Search, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { LOTTERY_CONFIG } from '../constants/lottery';

interface Draw {
  id: string;
  type: string;
  date: string;
  numbers: string[];
  jackpot: number;
}

export default function Results() {
  const { t, i18n } = useTranslation();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchDate, setSearchDate] = useState('');

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        let query = supabase
          .from('draws')
          .select('*')
          .order('date', { ascending: false });
        
        if (filterType !== 'all') {
          query = query.eq('type', filterType);
        }

        const { data } = await query;
        
        if (data) {
          let results = data as Draw[];

          if (searchDate) {
            results = results.filter(draw => {
              const drawDate = draw.date ? format(parseISO(draw.date), 'yyyy-MM-dd') : '';
              return drawDate === searchDate;
            });
          }

          setDraws(results);
        }
      } catch (err) {
        console.error('Error fetching draws:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDraws();
  }, [filterType, searchDate]);

  const getDateLocale = () => {
    return i18n.language === 'fr' ? fr : enUS;
  };

  const drawTypes = Object.keys(LOTTERY_CONFIG);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t('results') || 'Results'}</h1>
          <p className="text-gray-500">Archives complètes des tirages officiels</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            >
              <option value="all">Tous les types</option>
              {drawTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="date" 
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>
          
          {searchDate && (
            <button 
              onClick={() => setSearchDate('')}
              className="text-xs text-accent font-bold hover:underline"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : draws.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-gray-200">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Aucun résultat trouvé</h3>
          <p className="text-gray-500">Essayez de modifier vos filtres ou votre recherche.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">{t('date') || 'Date'}</th>
                <th className="px-6 py-4">{t('draw_type') || 'Type'}</th>
                <th className="px-6 py-4">{t('numbers') || 'Numbers'}</th>
                <th className="px-6 py-4 text-right">Jackpot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {draws.map((draw) => (
                <tr key={draw.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="text-sm font-bold text-gray-900">
                      {draw.date ? format(parseISO(draw.date), 'PPP', { locale: getDateLocale() }) : ''}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {draw.date ? format(parseISO(draw.date), 'HH:mm') : ''}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {draw.type}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex gap-2">
                      {draw.numbers.map((num, idx) => (
                        <div 
                          key={idx} 
                          className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm"
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="text-lg font-black text-gray-900">
                      {draw.jackpot.toLocaleString()} HTG
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
