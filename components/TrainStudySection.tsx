import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { User, StudyGroup } from '../types';
import { StudyGroupChat } from './StudyGroupChat';

interface TrainStudySectionProps {
    currentUser: User;
}

const STATIONS = [
    { name: 'Milano Centrale', id: 'S01700' },
    { name: 'Milano Garibaldi', id: 'S01020' },
    { name: 'Milano Bovisa', id: 'S00248' },
    { name: 'Milano Rogoredo', id: 'S01820' },
];

export const TrainStudySection: React.FC<TrainStudySectionProps> = ({ currentUser }) => {
    const [selectedStation, setSelectedStation] = useState(STATIONS[0].id);
    const [departures, setDepartures] = useState<any[]>([]);
    const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [creatingGroupId, setCreatingGroupId] = useState<string | null>(null);
    const [newGroupSubject, setNewGroupSubject] = useState('');

    // Time selector state
    const [selectedTime, setSelectedTime] = useState<string>(''); // "" means "now"

    const refreshData = async () => {
        setLoading(true);
        try {
            // Determine time to fetch: if selectedTime is set, create a Date object
            let timeToFetch: Date | undefined = undefined;
            if (selectedTime) {
                const [hours, minutes] = selectedTime.split(':').map(Number);
                const date = new Date();
                date.setHours(hours, minutes, 0, 0);

                // If selected time is earlier than now (with a buffer, e.g. 1 hour ago), assumes it's for tomorrow.
                // Example: It's 20:00, user selects 07:00 -> They mean tomorrow 07:00.
                if (date.getTime() < Date.now() - 3600000) { // 1 hour buffer
                    date.setDate(date.getDate() + 1);
                }
                timeToFetch = date;
            }

            const [deps, groups] = await Promise.all([
                db.getRealTimeDepartures(selectedStation, timeToFetch),
                db.getStudyGroups()
            ]);
            setDepartures(deps || []);
            setStudyGroups(groups || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [selectedStation, selectedTime]);

    const handleCreateGroup = async (trainNumber: string, trainLine: string, departureTimeStr: string) => {
        if (!newGroupSubject.trim()) return;

        const stationName = STATIONS.find(s => s.id === selectedStation)?.name || 'Unknown';

        const newGroup: StudyGroup = {
            id: Date.now().toString(),
            trainNumber,
            trainLine,
            departureTime: departureTimeStr,
            subject: newGroupSubject,
            from: stationName,
            creatorId: currentUser.id,
            members: [currentUser.id],
            maxMembers: 4
        };

        await db.createStudyGroup(newGroup);
        setNewGroupSubject('');
        setCreatingGroupId(null);
        refreshData();
    };

    const handleJoinGroup = async (groupId: string) => {
        await db.joinStudyGroup(groupId, currentUser.id);
        refreshData();
    };

    return (
        <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">🚄</span>
                        <h2 className="text-2xl font-black tracking-tight">Treno & Studio</h2>
                    </div>
                    <p className="text-slate-400 font-medium text-sm">Viaggia, studia e conosci compagni sul tuo stesso vagone.</p>

                    <div className="mt-6 flex flex-wrap gap-2 items-center">
                        {STATIONS.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedStation(s.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedStation === s.id
                                    ? 'bg-white text-slate-900 shadow-lg'
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                    }`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Decorative BG */}
                <div className="absolute right-0 bottom-0 opacity-10 font-black text-9xl transform translate-x-1/4 translate-y-1/4 pointer-events-none">
                    TRAIN
                </div>
            </div>

            <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Partenze
                        </h3>
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                            <span className="text-[10px] font-bold text-slate-400 px-2">DAI:</span>
                            <input
                                type="time"
                                className="bg-white text-xs font-bold px-2 py-1 rounded-md border-none focus:ring-0 text-slate-700"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                            />
                            {selectedTime && (
                                <button
                                    onClick={() => setSelectedTime('')}
                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2"
                                >
                                    ADESSO
                                </button>
                            )}
                        </div>
                    </div>
                    <button onClick={refreshData} className="text-xs font-bold text-brand-600 hover:underline">
                        🔄 Aggiorna
                    </button>
                </div>

                {loading && departures.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm animate-pulse">Caricamento tabellone...</div>
                ) : (
                    <div className="space-y-4">
                        {departures.slice(0, 15).map((train, idx) => { // Increased to 15 to show more
                            // ViaggiaTreno API format usually puts train number in numeroTreno
                            const trainNum = train.numeroTreno;
                            const destination = train.destinazione;
                            const time = train.orarioPartenza ? new Date(train.orarioPartenza).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                            const delay = train.ritardo > 0 ? `+${train.ritardo}'` : 'On time';

                            // Find active group for this specific train number
                            const group = studyGroups.find(g => g.trainNumber == trainNum);
                            const isMember = group?.members.includes(currentUser.id);

                            return (
                                <div key={idx} className="group relative bg-slate-50 hover:bg-white border border-slate-100 p-4 rounded-2xl transition-all hover:shadow-md hover:border-brand-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    {train.categoria || 'REG'} {trainNum}
                                                </span>
                                                <h4 className="font-bold text-slate-800">{destination}</h4>
                                            </div>
                                            <div className="text-xs font-medium text-slate-400 mt-1 flex gap-3">
                                                <span>🕒 {time}</span>
                                                <span className={train.ritardo > 0 ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>
                                                    {delay}
                                                </span>
                                                <span>Binario: {train.binarioEffettivoPartenzaDescrizione || train.binarioProgrammatoPartenzaDescrizione || '?'}</span>
                                            </div>
                                        </div>

                                        {group ? (
                                            <div className="text-right">
                                                <div className="bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl mb-2">
                                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Gruppo Studio</p>
                                                    <p className="text-xs font-bold text-indigo-700">{group.subject}</p>
                                                    <p className="text-[10px] text-indigo-500 mt-0.5">{group.members.length}/{group.maxMembers} studenti</p>
                                                </div>
                                                {isMember ? (
                                                    <div className="mt-2">
                                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded block text-center mb-1">
                                                            Sei nel gruppo ✅
                                                        </span>
                                                        <StudyGroupChat
                                                            groupId={group.id}
                                                            currentUser={currentUser}
                                                            groupName={group.subject}
                                                        />
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleJoinGroup(group.id)}
                                                        className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                                                    >
                                                        Unisciti
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            creatingGroupId === trainNum.toString() ? (
                                                <div className="flex items-center gap-2 animate-in slide-in-from-right">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Materia (es. Analisi)"
                                                        className="w-32 px-3 py-1.5 rounded-lg text-xs border border-brand-300 focus:ring-2 focus:ring-brand-500 outline-none"
                                                        value={newGroupSubject}
                                                        onChange={e => setNewGroupSubject(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={() => handleCreateGroup(trainNum.toString(), `${destination}`, time)}
                                                        className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                                                    >
                                                        Ok
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setCreatingGroupId(trainNum.toString())}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
                                                >
                                                    + Crea Gruppo
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {departures.length === 0 && (
                            <p className="text-center text-slate-400 text-xs py-4">Nessun treno in partenza trovato per questo orario.</p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};
