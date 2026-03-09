
import React, { useEffect, useState } from 'react';
import { Trip, User } from '../types';
import { TripChat } from './TripChat';
import { db } from '../db';
import { useLanguage } from '../i18n';
import { UserRating, DriverLicense } from '../types';

interface TripCardProps {
  trip: Trip;
  currentUser: User;
  onQuickBook?: (tripId: string, seats: number) => void;
  onCancelParticipation?: (tripId: string) => void;
  onCancelTrip?: (tripId: string) => void;
  onViewProfile?: (userId: string) => void;
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
    <div className="mt-6 pt-4 border-t border-slate-200/30 dark:border-slate-700/30">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
        {t.passengers_on_board} ({names.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {names.map((name, idx) => (
          <span key={idx} className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-full pl-1 pr-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 backdrop-blur-sm">
            <div className="w-5 h-5 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-slate-300">
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
  onCancelTrip,
  onViewProfile
}) => {
  const { t, language } = useLanguage();
  const isAvailable = trip.seatsAvailable > 0;
  const isDriver = trip.driverId === currentUser.id;
  const isPassenger = trip.passengerIds && trip.passengerIds.includes(currentUser.id);
  const [driverRating, setDriverRating] = useState<UserRating | null>(null);
  const [driverLicenseVerified, setDriverLicenseVerified] = useState(false);

  useEffect(() => {
    const loadDriverData = async () => {
      try {
        const [rating, license] = await Promise.all([
          db.getUserRating(trip.driverId),
          db.getDriverLicense(trip.driverId)
        ]);
        setDriverRating(rating);
        setDriverLicenseVerified(license?.status === 'verified');
      } catch (e) {
        console.error("Error loading driver data", e);
      }
    };
    loadDriverData();
  }, [trip.driverId]);

  // Refresh driver rating when sync event is triggered (e.g., after a new review)
  useEffect(() => {
    const handleSync = () => {
      const refreshDriverData = async () => {
        try {
          const rating = await db.getUserRating(trip.driverId);
          setDriverRating(rating);
        } catch (e) {
          console.error("Error refreshing driver rating", e);
        }
      };
      refreshDriverData();
    };
    window.addEventListener('ecoshift-sync', handleSync);
    return () => window.removeEventListener('ecoshift-sync', handleSync);
  }, [trip.driverId]);

  const renderStars = (rating: number | null | undefined) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= fullStars ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>
          ★
        </span>
      );
    }
    return stars;
  };

  const hasPositiveReviews = driverRating && driverRating.totalReviews >= 3 && driverRating.rating && driverRating.rating >= 4;

  return (
    <article
      className={`glass-card p-6 md:p-8 bg-white dark:bg-slate-800/40 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-neon ${!isAvailable && !isPassenger && !isDriver ? 'opacity-60 grayscale-[0.3]' : ''}`}
      tabIndex={0}
    >
      {/* Decorative gradient blob */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-all duration-500"></div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">

        {/* Main Route Info */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Route Timeline */}
            <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.departure_point}</p>
                <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">{trip.from}</p>
              </div>
              <div className="flex flex-col items-center px-1 opacity-40">
                <span className="text-[8px] font-black tracking-widest text-slate-400">VIA</span>
                <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-600 my-0.5"></div>
              </div>
              <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.destination_point}</p>
                <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">{trip.to}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isDriver && (
                <span className="bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-brand-500/30 uppercase tracking-wider">
                  {t.your_proposal}
                </span>
              )}
              {isPassenger && !isDriver && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-emerald-500/30 uppercase tracking-wider">
                  {t.booked}
                </span>
              )}
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 uppercase tracking-wider flex items-center gap-1">
                {t.vehicle_type || 'Auto'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                📅
              </div>
              <span>{new Date(trip.departureTime).toLocaleDateString(language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                👥
              </div>
              <span>{trip.seatsAvailable} {trip.seatsAvailable === 1 ? t.seat : t.seats}</span>
            </div>
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                🌿
              </div>
              <span>-{trip.co2Saved}{t.co2_saved_kg}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {trip.tutoringSubject && (
              <span className="bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-100/50 dark:border-blue-800/30 flex items-center gap-2 backdrop-blur-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                {t.mission_4_tutoring.replace('{subject}', trip.tutoringSubject)}
              </span>
            )}
            {trip.assistanceOffered && (
              <span className="bg-orange-50/50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-orange-100/50 dark:border-orange-800/30 flex items-center gap-2 backdrop-blur-sm">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                {t.mission_5_inclusion}
              </span>
            )}
          </div>
        </div>

{/* Action Column */}
        <div className="flex flex-col items-start md:items-end justify-between min-h-[140px] gap-6 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.driver_label}</p>
              <p 
                className={`text-sm font-bold text-slate-800 dark:text-white ${!isDriver && onViewProfile ? 'cursor-pointer hover:text-brand-600' : ''}`}
                onClick={() => !isDriver && onViewProfile && onViewProfile(trip.driverId)}
              >
                {isDriver ? t.me : trip.driverName}
                {driverLicenseVerified && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-emerald-500 rounded-full text-[8px] text-white" title="Patente verificata">✓</span>
                )}
              </p>
              {driverRating && driverRating.rating != null && driverRating.totalReviews > 0 ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-bold text-amber-500">{driverRating.rating.toFixed(1)}</span>
                  <div className="flex">{renderStars(driverRating.rating)}</div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({driverRating.totalReviews})
                  </span>
                  {hasPositiveReviews && (
                    <span className="ml-1 text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                      ✓
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">{t.no_reviews_yet || 'Nessuna valutazione'}</span>
                </div>
              )}
            </div>
            <div 
              className={`relative ${!isDriver && onViewProfile ? 'cursor-pointer' : ''}`}
              onClick={() => !isDriver && onViewProfile && onViewProfile(trip.driverId)}
            >
              <img
                src={`https://picsum.photos/seed/${trip.driverId}/64/64`}
                alt={trip.driverName}
                className="w-12 h-12 rounded-2xl border-2 border-white dark:border-slate-700 shadow-md object-cover"
              />
              {!isDriver && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] text-white">✓</div>
              )}
            </div>
            <div className="block md:hidden">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.driver_label}</p>
              <p 
                className={`text-sm font-bold text-slate-800 dark:text-white ${!isDriver && onViewProfile ? 'cursor-pointer hover:text-brand-600' : ''}`}
                onClick={() => !isDriver && onViewProfile && onViewProfile(trip.driverId)}
              >
                {isDriver ? t.me : trip.driverName}
                {driverLicenseVerified && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-emerald-500 rounded-full text-[8px] text-white" title="Patente verificata">✓</span>
                )}
              </p>
              {driverRating && driverRating.rating != null && driverRating.totalReviews > 0 ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-bold text-amber-500">{driverRating.rating.toFixed(1)}</span>
                  <div className="flex">{renderStars(driverRating.rating)}</div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({driverRating.totalReviews})
                  </span>
                  {hasPositiveReviews && (
                    <span className="ml-1 text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                      ✓
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">{t.no_reviews_yet || 'Nessuna valutazione'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full flex gap-3">
            {!isDriver && !isPassenger && (
              <button
                disabled={!isAvailable}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickBook?.(trip.id, 1); }}
                className="btn-premium w-full sm:w-auto px-8 py-3.5 text-sm md:ml-auto disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
              >
                {t.book_now}
              </button>
            )}

            {isPassenger && !isDriver && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancelParticipation?.(trip.id); }}
                className="w-full sm:w-auto bg-white dark:bg-transparent text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-95 md:ml-auto"
              >
                {t.cancel_unexpected}
              </button>
            )}

            {isDriver && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancelTrip?.(trip.id); }}
                className="w-full sm:w-auto bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-rose-500 hover:text-white transition-all active:scale-95 md:ml-auto"
              >
                {t.cancel_commitment}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Passenger List */}
      {(isDriver || isPassenger) && trip.passengerIds && trip.passengerIds.length > 0 && (
        <PassengerList passengerIds={trip.passengerIds} />
      )}

      {
        (isDriver || isPassenger) && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <TripChat tripId={trip.id} currentUser={currentUser} />
          </div>
        )
      }
    </article>
  );
};
