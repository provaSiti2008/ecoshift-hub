import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Message, User } from '../types';

interface StudyGroupChatProps {
    groupId: string;
    currentUser: User;
    groupName: string;
}

export const StudyGroupChat: React.FC<StudyGroupChatProps> = ({ groupId, currentUser, groupName }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadMessages = async () => {
        // Reuse getMessages since it just filters by tripId matching our groupId
        const msgs = await db.getMessages(groupId);
        setMessages(msgs);
    };

    useEffect(() => {
        if (isOpen) {
            loadMessages();
            // Poll for new messages every 3s
            const interval = setInterval(loadMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen, groupId]);

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
            tripId: groupId, // Storing groupId in tripId column
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: newMessage.trim(),
            timestamp: new Date().toISOString()
        };

        await db.sendMessage(message);
        setNewMessage('');
        loadMessages();

        // Notify other group members
        const groups = await db.getStudyGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            const recipients = (group.members || []).filter(id => id !== currentUser.id);
            const uniqueRecipients = [...new Set(recipients)];

            for (const recipientId of uniqueRecipients) {
                await db.addNotification({
                    id: Math.random().toString(),
                    userId: recipientId,
                    text: `Nuovo messaggio nel gruppo "${groupName}" da ${currentUser.name}`,
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
                className="w-full mt-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-indigo-200"
            >
                <span>💬</span> Chat Gruppo
            </button>
        );
    }

    return (
        <div className="mt-2 bg-white rounded-xl overflow-hidden border border-indigo-100 shadow-lg animate-in fade-in zoom-in duration-200 relative z-20">
            <div className="bg-indigo-50 px-3 py-2 flex justify-between items-center border-b border-indigo-100">
                <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest truncate max-w-[150px]">{groupName}</h4>
                <button onClick={() => setIsOpen(false)} className="text-indigo-400 hover:text-indigo-600 font-bold px-2">✕</button>
            </div>

            <div
                ref={scrollRef}
                className="h-40 overflow-y-auto p-3 space-y-2 bg-slate-50"
            >
                {messages.length === 0 ? (
                    <p className="text-center text-[9px] text-slate-400 font-medium italic mt-12">
                        Nessun messaggio.
                    </p>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.senderId === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[90%] px-3 py-1.5 rounded-xl text-[10px] font-medium leading-tight ${isMe
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                                <span className="text-[8px] text-slate-400 mt-0.5 mx-1 font-bold">
                                    {isMe ? 'Tu' : msg.senderName}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={handleSend} className="p-1.5 bg-white border-t border-indigo-50 flex gap-1">
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Scrivi..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-medium focus:ring-1 focus:ring-indigo-500 outline-none border border-slate-100"
                />
                <button
                    type="submit"
                    className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-all font-black text-xs"
                >
                    ➤
                </button>
            </form>
        </div>
    );
};
