
import React, { useState } from 'react';
import { db } from '../db';
import { Trip, User } from '../types';
import { KNOWN_LOCATIONS } from '../constants';
import { useLanguage } from '../i18n';

interface OfferRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onTripCreated: () => void;
  onUserUpdate: (user: User) => void;
}

export const OfferRideModal: React.FC<OfferRideModalProps> = ({ isOpen, onClose, currentUser, onTripCreated, onUserUpdate }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    departureTime: '',
    seatsAvailable: 3,
    tutoringSubject: '',
    assistanceOffered: false,
    distanceKm: 10
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const reward = 50;
    const newTrip: Trip = {
      id: Math.random().toString(36).substr(2, 9),
      driverId: currentUser.id,
      driverName: currentUser.name,
      from: formData.from,
      to: formData.to,
      departureTime: formData.departureTime,
      seatsAvailable: formData.seatsAvailable,
      distanceKm: formData.distanceKm,
      co2Saved: Math.round(formData.distanceKm * 0.3 * 10) / 10,
      tutoringSubject: formData.tutoringSubject || undefined,
      assistanceOffered: formData.assistanceOffered,
      passengerIds: []
    };

    await db.saveTrip(newTrip);
    const updatedUser = await db.updateUserCredits(currentUser.id, reward);
    if (updatedUser) onUserUpdate(updatedUser);

    await db.addCreditLog({
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      amount: reward,
      reason: `Bonus proposta viaggio: ${formData.to}`,
      timestamp: new Date().toISOString()
    });

    onTripCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 px-8 py-6 text-white shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t.propose_trip_header}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">✕</button>
          </div>
          <p className="text-indigo-100 text-sm mt-1">{t.propose_trip_subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t.route_details}</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.departure_point}</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-ring appearance-none"
                  value={formData.from}
                  onChange={e => setFormData({ ...formData, from: e.target.value })}
                >
                  <option value="">{t.select_departure}</option>
                  {KNOWN_LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.destination_point}</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-ring appearance-none"
                  value={formData.to}
                  onChange={e => setFormData({ ...formData, to: e.target.value })}
                >
                  <option value="">{t.select_destination}</option>
                  {KNOWN_LOCATIONS.filter(l => l !== formData.from).map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t.date_time}</label>
              <input
                required
                type="datetime-local"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-ring"
                value={formData.departureTime}
                onChange={e => setFormData({ ...formData, departureTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t.available_seats}</label>
              <input
                type="number"
                min="1"
                max="8"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-ring"
                value={formData.seatsAvailable}
                onChange={e => setFormData({ ...formData, seatsAvailable: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">{t.peer_tutoring}</h3>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t.subject_optional}</label>
              <input
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-ring"
                placeholder="Es: Analisi 1, Fisica..."
                value={formData.tutoringSubject}
                onChange={e => setFormData({ ...formData, tutoringSubject: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-orange-500">{t.social_inclusion}</h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.assistanceOffered}
                  onChange={e => setFormData({ ...formData, assistanceOffered: e.target.checked })}
                />
                <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-orange-500 transition-colors"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full peer-checked:translate-x-6 transition-transform"></div>
              </div>
              <span className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors">
                {t.assist_special_needs}
              </span>
            </label>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all focus-ring"
            >
              {t.publish_trip}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
