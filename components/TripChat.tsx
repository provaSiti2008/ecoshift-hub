import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Message, User } from '../types';

interface TripChatProps {
    tripId: string;
    currentUser: User;
}

export const TripChat: React.FC<TripChatProps> = ({ tripId, currentUser }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadMessages = async () => {
        const msgs = await db.getMessages(tripId);
        setMessages(msgs);
    };

    useEffect(() => {
        if (isOpen) {
            loadMessages();
            // Poll per nuovi messaggi ogni 2 secondi (simulazione real-time)
            const interval = setInterval(loadMessages, 2000);
            return () => clearInterval(interval);
        }
    }, [isOpen, tripId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            tripId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: newMessage.trim(),
            timestamp: new Date().toISOString()
        };

        await db.sendMessage(message);
        setNewMessage('');
        loadMessages();

        // Notifica gli altri partecipanti
        const trips = await db.getTrips();
        const trip = trips.find(t => t.id === tripId);
        if (trip) {
            const recipients = [trip.driverId, ...(trip.passengerIds || [])].filter(id => id !== currentUser.id);
            // Rimuovi duplicati (se ci sono)
            const uniqueRecipients = [...new Set(recipients)];

            for (const recipientId of uniqueRecipients) {
                await db.addNotification({
                    id: Math.random().toString(),
                    userId: recipientId,
                    text: `Nuovo messaggio da ${currentUser.name} nel viaggio per ${trip.to}`,
                    read: false,
                    type: 'info',
                    timestamp: new Date().toISOString()
                });
            }
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full mt-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
                <span>💬</span> Chat Viaggio
            </button>
        );
    }

    return (
        <div className="mt-4 bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 animate-in slide-in-from-top duration-300">
            <div className="bg-slate-200 px-4 py-3 flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest">Chat di Gruppo</h4>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div
                ref={scrollRef}
                className="h-48 overflow-y-auto p-4 space-y-3"
            >
                {messages.length === 0 ? (
                    <p className="text-center text-[10px] text-slate-400 font-medium italic mt-16">
                        Nessun messaggio. Inizia la conversazione!
                    </p>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.senderId === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-xs font-medium ${isMe
                                    ? 'bg-brand-600 text-white rounded-br-none'
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                                <span className="text-[9px] text-slate-400 mt-1 mx-1 font-bold">
                                    {isMe ? 'Tu' : msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={handleSend} className="p-2 bg-white border-t border-slate-200 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Scrivi un messaggio..."
                    className="flex-1 px-4 py-2 bg-slate-50 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                />
                <button
                    type="submit"
                    className="bg-brand-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-brand-700 transition-all font-black"
                >
                    ➤
                </button>
            </form>
        </div>
    );
};
