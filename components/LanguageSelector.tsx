
import React from 'react';
import { useLanguage } from '../i18n';

export const LanguageSelector: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="relative group mr-2">
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="appearance-none bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest pl-3 pr-8 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors"
            >
                <option value="it">🇮🇹 IT</option>
                <option value="en">🇬🇧 EN</option>
                <option value="es">🇪🇸 ES</option>
                <option value="fr">🇫🇷 FR</option>
                <option value="de">🇩🇪 DE</option>
                <option value="nl">🇳🇱 NL</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
            </div>
        </div>
    );
};
