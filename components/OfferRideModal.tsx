
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

  const [errors, setErrors] = useState<{
    from?: string;
    to?: string;
    departureTime?: string;
  }>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.from) {
      newErrors.from = t.error_select_departure;
    }
    if (!formData.to) {
      newErrors.to = t.error_select_destination;
    }
    if (!formData.departureTime) {
      newErrors.departureTime = t.error_select_datetime;
    } else {
      const tripDate = new Date(formData.departureTime);
      if (tripDate < new Date()) {
        newErrors.departureTime = t.error_past_datetime;
      }
    }
    if (formData.from && formData.to && formData.from === formData.to) {
      newErrors.to = t.error_same_location;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const reward = 50;
    
    // Capitalizza la materia (Fisica, Analisi 1, etc.)
    const capitalizeSubject = (subject: string): string => {
      if (!subject) return '';
      return subject
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    const newTrip: Trip = {
      id: Math.random().toString(36).substr(2, 9),
      driverId: currentUser.id,
      driverName: currentUser.name,
      from: formData.from,
      to: formData.to,
      departureTime: formData.departureTime,
      seatsAvailable: formData.seatsAvailable,
      // distanceKm e co2Saved vengono calcolati automaticamente dal server
      tutoringSubject: formData.tutoringSubject ? capitalizeSubject(formData.tutoringSubject.trim()) : undefined,
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
          {/* Banner errore generale */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-rose-700">Correggi gli errori seguenti:</p>
                <ul className="text-sm text-rose-600 mt-1 list-disc list-inside">
                  {errors.from && <li>{errors.from}</li>}
                  {errors.to && <li>{errors.to}</li>}
                  {errors.departureTime && <li>{errors.departureTime}</li>}
                </ul>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t.route_details}</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.departure_point}</label>
                <select
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus-ring appearance-none ${errors.from ? 'border-rose-400 ring-2 ring-rose-400' : 'border-slate-200'}`}
                  style={{ color: '#1e293b' }}
                  value={formData.from}
                  onChange={e => setFormData({ ...formData, from: e.target.value })}
                >
                  <option value="" style={{ color: '#1e293b', backgroundColor: '#ffffff' }}>{t.select_departure}</option>
                  {KNOWN_LOCATIONS.map(loc => (
                    <option key={loc} value={loc} style={{ color: '#1e293b', backgroundColor: '#ffffff' }}>{loc}</option>
                  ))}
                </select>
                {errors.from && (
                  <div className="flex items-center gap-1 mt-2 px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg">
                    <span className="text-rose-500 text-sm">⚠️</span>
                    <span className="text-rose-600 text-xs font-semibold">{errors.from}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.destination_point}</label>
                <select
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus-ring appearance-none ${errors.to ? 'border-rose-400 ring-2 ring-rose-400' : 'border-slate-200'}`}
                  style={{ color: '#1e293b' }}
                  value={formData.to}
                  onChange={e => setFormData({ ...formData, to: e.target.value })}
                >
                  <option value="" style={{ color: '#1e293b', backgroundColor: '#ffffff' }}>{t.select_destination}</option>
                  {KNOWN_LOCATIONS.filter(l => l !== formData.from).map(loc => (
                    <option key={loc} value={loc} style={{ color: '#1e293b', backgroundColor: '#ffffff' }}>{loc}</option>
                  ))}
                </select>
                {errors.to && (
                  <div className="flex items-center gap-1 mt-2 px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg">
                    <span className="text-rose-500 text-sm">⚠️</span>
                    <span className="text-rose-600 text-xs font-semibold">{errors.to}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t.date_time}</label>
              <input
                type="datetime-local"
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus-ring ${errors.departureTime ? 'border-rose-400 ring-2 ring-rose-400' : 'border-slate-200'}`}
                style={{ color: '#1e293b' }}
                value={formData.departureTime}
                onChange={e => setFormData({ ...formData, departureTime: e.target.value })}
              />
              {errors.departureTime && (
                <div className="flex items-center gap-1 mt-2 px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg">
                  <span className="text-rose-500 text-sm">⚠️</span>
                  <span className="text-rose-600 text-xs font-semibold">{errors.departureTime}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t.available_seats}</label>
              <input
                type="number"
                min="1"
                max="8"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-ring"
                style={{ color: '#1e293b' }}
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-ring text-slate-900 placeholder:text-slate-400"
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
