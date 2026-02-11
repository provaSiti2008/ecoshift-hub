
import React, { useEffect, useState } from 'react';
import { Trip, User } from '../types';
import { TripChat } from './TripChat';
import { db } from '../db';
import { useLanguage } from '../i18n';

interface TripCardProps {
  trip: Trip;
  currentUser: User;
  onQuickBook?: (tripId: string, seats: number) => void;
  onCancelParticipation?: (tripId: string) => void;
  onCancelTrip?: (tripId: string) => void;
}

const PassengerList: React.FC<{ passengerIds: string[] }> = ({ passengerIds }) => {
  const { t } = useLanguage();
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    const loadNames = async () => {
      if (!passengerIds || passengerIds.length === 0) return;
      try {
        const users = await db.getUsers();
        const foundNames = users
          .filter(u => passengerIds.includes(u.id))
          .map(u => u.name);
        setNames(foundNames);
      } catch (e) {
        console.error("Error loading passenger names", e);
      }
    };
    loadNames();
  }, [passengerIds]);

  if (names.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
        {t.passengers_on_board} ({names.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {names.map((name, idx) => (
          <span key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1 text-xs font-medium text-slate-600">
            <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-500 overflow-hidden">
              {name.charAt(0)}
            </div>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
};

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  currentUser,
  onQuickBook,
  onCancelParticipation,
  onCancelTrip
}) => {
  const { t, language } = useLanguage();
  const isAvailable = trip.seatsAvailable > 0;
  const isDriver = trip.driverId === currentUser.id;
  const isPassenger = trip.passengerIds && trip.passengerIds.includes(currentUser.id);

  return (
    <article
      className={`bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 group ${!isAvailable && !isPassenger && !isDriver ? 'opacity-60 grayscale-[0.3]' : ''}`}
      tabIndex={0}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

        {/* Main Route Info: Partenza e Arrivo in evidenza */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.departure_point}</p>
                <p className="text-lg font-black text-slate-900 tracking-tight">{trip.from}</p>
              </div>
              <div className="flex items-center px-1">
                <div className="h-[2px] w-3 sm:w-6 bg-brand-300"></div>
                <span className="mx-1 text-slate-400" aria-hidden>→</span>
                <div className="h-[2px] w-3 sm:w-6 bg-brand-300"></div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.destination_point}</p>
                <p className="text-lg font-black text-slate-900 tracking-tight">{trip.to}</p>
              </div>
            </div>
            {isDriver && (
              <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-brand-100 uppercase tracking-wider">
                {t.your_proposal}
              </span>
            )}
            {isPassenger && !isDriver && (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                {t.booked}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <span className="opacity-60 text-base">📅</span>
              {new Date(trip.departureTime).toLocaleDateString(language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-60 text-base">👥</span>
              {trip.seatsAvailable} {trip.seatsAvailable === 1 ? t.seat : t.seats}
            </div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <span className="text-base">🌿</span>
              -{trip.co2Saved}{t.co2_saved_kg}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {trip.tutoringSubject && (
              <span className="bg-blue-50/50 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-100/50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                {t.mission_4_tutoring.replace('{subject}', trip.tutoringSubject)}
              </span>
            )}
            {trip.assistanceOffered && (
              <span className="bg-orange-50/50 text-orange-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-orange-100/50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                {t.mission_5_inclusion}
              </span>
            )}
          </div>
        </div>

        {/* Action Column */}
        <div className="flex flex-col items-center md:items-end justify-between min-h-[120px] gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.driver_label}</p>
              <p className="text-sm font-bold text-slate-800">{isDriver ? t.me : trip.driverName}</p>
            </div>
            <img
              src={`https://picsum.photos/seed/${trip.driverId}/64/64`}
              alt={trip.driverName}
              className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm ring-1 ring-slate-100 object-cover"
            />
          </div>

          <div className="w-full flex gap-2">
            {!isDriver && !isPassenger && (
              <button
                disabled={!isAvailable}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickBook?.(trip.id, 1); }}
                className="w-full sm:w-auto bg-brand-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-brand-200 active:scale-95 flex items-center justify-center gap-2"
              >
                {t.book_now}
              </button>
            )}

            {isPassenger && !isDriver && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancelParticipation?.(trip.id); }}
                className="w-full sm:w-auto bg-white text-rose-600 border border-rose-100 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-rose-50 transition-all active:scale-95"
              >
                {t.cancel_unexpected}
              </button>
            )}

            {isDriver && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancelTrip?.(trip.id); }}
                className="w-full sm:w-auto bg-rose-500 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 active:scale-95"
              >
                {t.cancel_commitment}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Passenger List: visible to driver or passengers */}
      {(isDriver || isPassenger) && trip.passengerIds && trip.passengerIds.length > 0 && (
        <PassengerList passengerIds={trip.passengerIds} />
      )}

      {
        (isDriver || isPassenger) && (
          <TripChat tripId={trip.id} currentUser={currentUser} />
        )
      }
    </article>
  );
};
