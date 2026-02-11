import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { User } from '../types';
import { useLanguage } from '../i18n';

interface LeaderboardProps {
    currentUserId: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId }) => {
    const { t } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        // Caricamento iniziale e refresh ogni volta che il componente monta
        const loadUsers = async () => {
            const allUsers = await db.getUsers();
            // Ordina per crediti decrescente e prendi i primi 5
            const sorted = allUsers.sort((a, b) => b.credits - a.credits).slice(0, 5);
            setUsers(sorted);
        };

        loadUsers();

        // Ascolta eventi di sync per aggiornare la classifica in tempo reale
        const handleSync = () => loadUsers();
        window.addEventListener('ecoshift-sync', handleSync);
        return () => window.removeEventListener('ecoshift-sync', handleSync);
    }, []);

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span>🏆</span> {t.leaderboard_title}
                </h3>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t.top_5}</span>
            </div>

            <div className="space-y-4">
                {users.map((user, index) => {
                    const isMe = user.id === currentUserId;
                    let medal = '';
                    if (index === 0) medal = '🥇';
                    if (index === 1) medal = '🥈';
                    if (index === 2) medal = '🥉';

                    return (
                        <div
                            key={user.id}
                            className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${isMe ? 'bg-brand-50 border border-brand-100 shadow-sm' : 'hover:bg-slate-50'
                                }`}
                        >
                            <div className="w-8 flex justify-center font-black text-slate-400">
                                {medal || `#${index + 1}`}
                            </div>

                            <div className="relative">
                                <img
                                    src={`https://picsum.photos/seed/${user.id}/40/40`}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                                />
                                {index === 0 && (
                                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 ring-2 ring-white">
                                        <span className="text-[8px]">👑</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isMe ? 'text-brand-700' : 'text-slate-700'}`}>
                                    {user.name} {isMe && t.you_suffix}
                                </p>
                                <p className="text-[10px] font-medium text-slate-400">
                                    {t.level} {Math.floor(user.credits / 1000) + 1}
                                </p>
                            </div>

                            <div className="text-right">
                                <span className="block text-sm font-black text-emerald-600">
                                    {user.credits}
                                </span>
                                <span className="text-[8px] font-bold text-slate-300 uppercase">{t.credits}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
