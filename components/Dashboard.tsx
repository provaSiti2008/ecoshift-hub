
import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../i18n';
import { db } from '../db';
import { Trip, User, UserRole, StudyGroup } from '../types';
import { TripCard } from './TripCard';
import { SubjectDropdown } from './SubjectDropdown';
import { HelpModal } from './HelpModal';
import { OfferRideModal } from './OfferRideModal';
import { Leaderboard } from './Leaderboard';
import { MapView } from './MapView';
import { TrainStudySection } from './TrainStudySection';
import { Notification } from '../types';
import { MOCK_DRIVER_IDS } from '../constants';

const AsyncNotificationBadge = ({ userId }: { userId: string }) => {
  const [hasUnread, setHasUnread] = useState(false);
  useEffect(() => {
    db.getNotifications(userId).then(notifs => setHasUnread(notifs.some(n => !n.read)));
    // Add real-time polling or sync listener? Sync listener is set in Dashboard...
  }, [userId]);

  // Also listen for global sync
  useEffect(() => {
    const handleSync = () => db.getNotifications(userId).then(notifs => setHasUnread(notifs.some(n => !n.read)));
    window.addEventListener('ecoshift-sync', handleSync);
    return () => window.removeEventListener('ecoshift-sync', handleSync);
  }, [userId]);

  return hasUnread ? <span className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white/10"></span> : null;
};

const AsyncNotificationList = ({ userId }: { userId: string }) => {
  const { t } = useLanguage();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const refresh = () => db.getNotifications(userId).then(data => {
    if (Array.isArray(data)) {
      setNotifs(data);
    } else {
      setNotifs([]);
    }
  });

  useEffect(() => {
    refresh();
    window.addEventListener('ecoshift-sync', refresh);
    return () => window.removeEventListener('ecoshift-sync', refresh);
  }, [userId]);

  return (
    <>
      <div className="p-3 border-b border-slate-100 flex justify-between items-center">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.notifications}</h4>
        <span className="text-[10px] text-slate-400 font-bold">{notifs.length}</span>
      </div>
      <div className="max-h-64 overflow-y-auto p-1 space-y-1">
        {notifs.length === 0 ? (
          <p className="text-center text-[10px] text-slate-400 py-8">{t.no_news}</p>
        ) : (
          notifs.map(notif => (
            <div key={notif.id} className={`p-3 rounded-2xl text-xs flex gap-3 ${notif.read ? 'bg-white' : 'bg-brand-50/50'}`}>
              <span className="text-lg">{notif.type === 'success' ? '🎉' : notif.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
              <div>
                <p className="text-slate-700 font-medium leading-tight">{notif.text}</p>
                <p className="text-[9px] text-slate-400 mt-1">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

interface DashboardProps {
  currentUser: User;
  isOfferModalOpen: boolean;
  setIsOfferModalOpen: (open: boolean) => void;
  onUserUpdate: (user: User) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, isOfferModalOpen, setIsOfferModalOpen, onUserUpdate }) => {
  const { t } = useLanguage();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [bookingMessage, setBookingMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'trains'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [accessibilityOnly, setAccessibilityOnly] = useState<boolean>(false);

  // Listener per la sincronizzazione del database
  useEffect(() => {
    const handleSync = async (e: any) => {
      setLastSync(e.detail.timestamp);
      // Re-fetch trips
      loadData();
    };
    window.addEventListener('ecoshift-sync', handleSync);
    return () => window.removeEventListener('ecoshift-sync', handleSync);
  }, []);

  const loadData = async () => {
    const [allTrips, allGroups] = await Promise.all([
      db.getTrips(),
      db.getStudyGroups()
    ]);
    const now = new Date();
    // Filtro doppio: rimuove demo E viaggi scaduti
    const realTrips = allTrips
      .filter(t => !MOCK_DRIVER_IDS.includes(t.driverId))
      .filter(t => new Date(t.departureTime) >= now); // Nasconde viaggi scaduti

    // Filtro per gruppi di studio: rimuove demo e gestisce formato orario (HH:MM)
    const realGroups = allGroups
      .filter(g => !MOCK_DRIVER_IDS.includes(g.creatorId))
      .filter(g => {
        // Se departureTime è in formato orario (es. "14:30"), confronta con l'orario corrente
        if (g.departureTime && g.departureTime.match(/^\d{2}:\d{2}$/)) {
          const [hours, minutes] = g.departureTime.split(':').map(Number);
          const groupTime = hours * 60 + minutes;
          const currentTime = now.getHours() * 60 + now.getMinutes();
          return groupTime >= currentTime;
        }
        // Altrimenti tratta come data ISO completa
        return new Date(g.departureTime) >= now;
      });
    const sortedTrips = realTrips.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
    setTrips(sortedTrips);
    setStudyGroups(realGroups);
  };

  useEffect(() => {
    loadData();

    // Polling automatico ogni 5 secondi per vedere nuovi viaggi degli altri
    const pollInterval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [currentUser.id, activeTab]);

  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    trips.forEach(t => {
      if (t.tutoringSubject) subjects.add(t.tutoringSubject);
    });
    return Array.from(subjects).sort();
  }, [trips]);

  const filteredTrips = useMemo(() => {
    let source = trips;
    if (activeTab === 'mine') {
      source = trips.filter(t => t.driverId === currentUser.id || (t.passengerIds && t.passengerIds.includes(currentUser.id)));
    }

    const searchLower = searchQuery.toLowerCase().trim();
    const keywords = searchLower.split(/\s+/).filter(k => k.length > 1);

    return source.filter(trip => {
      const matchesSubject = subjectFilter === 'all' || trip.tutoringSubject === subjectFilter;
      const matchesAccessibility = !accessibilityOnly || trip.assistanceOffered;
      if (!matchesSubject || !matchesAccessibility) return false;

      if (searchLower === '') return true;

      return keywords.some(k => {
        const directMatch =
          trip.driverName.toLowerCase().includes(k) ||
          trip.from.toLowerCase().includes(k) ||
          trip.to.toLowerCase().includes(k) ||
          (trip.tutoringSubject?.toLowerCase().includes(k) || false);

        if (directMatch) return true;
        return false;
      });
    });
  }, [trips, subjectFilter, accessibilityOnly, searchQuery, activeTab, currentUser.id]);

  const handleQuickBook = async (tripId: string, seats: number) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    if (trip.seatsAvailable >= seats) {
      const passengerIds = trip.passengerIds || [];
      if (passengerIds.includes(currentUser.id)) return;

      const updatedTrip = await db.updateTrip(tripId, {
        seatsAvailable: trip.seatsAvailable - seats,
        passengerIds: [...passengerIds, currentUser.id]
      });
      const earnedCredits = Math.floor(trip.distanceKm * 2 * seats);
      const updatedUser = await db.updateUserCredits(currentUser.id, earnedCredits);

      if (updatedTrip) {
        setTrips(prev => prev.map(t => t.id === tripId ? updatedTrip : t));
        if (updatedUser) onUserUpdate(updatedUser);

        await db.addNotification({
          id: Date.now().toString(),
          userId: trip.driverId,
          text: t.booking_notification
            .replace('{name}', currentUser.name)
            .replace('{seats}', seats.toString())
            .replace('{seatLabel}', seats === 1 ? t.seat : t.seats)
            .replace('{to}', trip.to),
          read: false,
          type: 'success',
          timestamp: new Date().toISOString()
        });

        setBookingMessage({ text: t.booking_success.replace('{credits}', earnedCredits.toString()), type: 'success' });
        setTimeout(() => setBookingMessage(null), 3000);
      }
    }
  };

  const handleCancelParticipation = async (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    const penalty = -30;
    const updatedTrip = await db.updateTrip(tripId, {
      seatsAvailable: trip.seatsAvailable + 1,
      passengerIds: (trip.passengerIds || []).filter(id => id !== currentUser.id)
    });
    const updatedUser = await db.updateUserCredits(currentUser.id, penalty);
    if (updatedTrip) {
      setTrips(prev => prev.map(t => t.id === tripId ? updatedTrip : t));
      if (updatedUser) onUserUpdate(updatedUser);

      await db.addNotification({
        id: Date.now().toString(),
        userId: trip.driverId,
        text: t.cancel_notification
          .replace('{name}', currentUser.name)
          .replace('{to}', trip.to),
        read: false,
        type: 'warning',
        timestamp: new Date().toISOString()
      });

      setBookingMessage({ text: t.participation_cancelled, type: 'error' });
      setTimeout(() => setBookingMessage(null), 3000);
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    await db.deleteTrip(tripId);
    const updatedUser = await db.updateUserCredits(currentUser.id, -100);
    setTrips(prev => prev.filter(t => t.id !== tripId));
    if (updatedUser) onUserUpdate(updatedUser);

    // Notify passengers
    if (trip && trip.passengerIds) {
      for (const pid of trip.passengerIds) {
        await db.addNotification({
          id: Math.random().toString(),
          userId: pid,
          text: t.trip_cancelled_notification.replace('{to}', trip.to),
          read: false,
          type: 'warning',
          timestamp: new Date().toISOString()
        });
      };
    }

    setBookingMessage({ text: t.commitment_removed, type: 'error' });
    setTimeout(() => setBookingMessage(null), 3000);
  };

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8 pb-32 space-y-10 relative">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <OfferRideModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        currentUser={currentUser}
        onTripCreated={loadData}
        onUserUpdate={onUserUpdate}
      />

      {/* Toast Notifications */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
        {bookingMessage && (
          <div className={`px-6 py-4 rounded-3xl shadow-2xl font-bold text-white transition-all transform animate-in slide-in-from-top duration-300 flex items-center gap-3 ${bookingMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
            <span className="text-xl">{bookingMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <p className="text-sm">{bookingMessage.text}</p>
          </div>
        )}
      </div>

      {/* Hero Profile Header */}
      <header className="glass-header rounded-[2.5rem] p-10 text-white shadow-2xl group relative z-50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight">{t.eco_profile}</h1>
            <p className="text-brand-100 font-medium">{t.welcome_user.replace('{name}', currentUser.name)}</p>
            <div className="pt-4 flex justify-center md:justify-start gap-3">
              <button
                onClick={() => setIsHelpOpen(true)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2 rounded-2xl text-xs font-bold border border-white/20 transition-all flex items-center gap-2"
              >
                {t.how_it_works}
              </button>
              {lastSync && (
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50 self-center">
                  {t.last_save.replace('{time}', lastSync.toLocaleTimeString())}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            {/* Notification Bell */}
            <div className="relative group/notif z-50">
              <button className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center text-xl relative backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all">
                🔔
                <AsyncNotificationBadge userId={currentUser.id} />
              </button>

              {/* Dropdown */}
              <div className="absolute top-full right-0 mt-4 w-80 bg-white rounded-3xl p-2 shadow-2xl opacity-0 invisible group-hover/notif:opacity-100 group-hover/notif:visible transition-all duration-200 z-[100] origin-top-right transform scale-95 group-hover/notif:scale-100 ring-1 ring-black/5">
                <AsyncNotificationList userId={currentUser.id} />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 text-center min-w-[240px] border border-white/10 shadow-inner group-hover:bg-white/20 transition-all hidden md:block">
              <span
                key={currentUser.credits}
                className="block text-6xl font-black mb-1 drop-shadow-lg animate-in zoom-in-95 duration-300"
              >
                {currentUser.credits}
              </span>
              <span className="uppercase text-[11px] font-black tracking-[0.2em] opacity-80">{t.eco_credits}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Controls & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Promos, Actions, Trips */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col sm:flex-row bg-white p-1.5 rounded-3xl shadow-sm border border-slate-100">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'text-slate-500 hover:text-brand-600'}`}
            >
              {t.explore_offers}
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`flex-1 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'mine' ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'text-slate-500 hover:text-brand-600'}`}
            >
              {t.my_commitments}
            </button>
          </div>

          <button
            onClick={() => setActiveTab('trains')}
            className={`w-full py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'trains' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-indigo-900 border border-indigo-100 hover:bg-indigo-50'}`}
          >
            {t.train_study}
          </button>

          <div className="flex justify-end">
            <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
              >
                {t.list_view}
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'map' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
              >
                {t.map_view}
              </button>
            </div>
          </div>

          <section className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-brand-50 rounded-3xl flex items-center justify-center text-3xl shadow-inner">🚗</div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">{t.create_impact_title}</h2>
                <p className="text-slate-400 text-sm font-medium">{t.create_impact_desc}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOfferModalOpen(true)}
              className="w-full md:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              {t.propose_trip_btn}
            </button>
          </section>

          {/* Filters & Results */}
          <section className="space-y-8">
            {activeTab === 'all' && (
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</span>
                  <input
                    type="text"
                    placeholder={t.search_placeholder}
                    className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-3xl text-sm font-semibold focus:border-brand-500 focus:ring-0 outline-none transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <SubjectDropdown
                  subjects={availableSubjects}
                  selectedSubject={subjectFilter}
                  onSelect={setSubjectFilter}
                />
                <button
                  onClick={() => setAccessibilityOnly(!accessibilityOnly)}
                  className={`h-[62px] px-8 rounded-3xl text-sm font-black transition-all border flex items-center gap-3 whitespace-nowrap ${accessibilityOnly
                    ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200'
                    }`}
                >
                  {t.support_m5}
                </button>
              </div>
            )}

            {activeTab === 'trains' && (
              <TrainStudySection currentUser={currentUser} />
            )}

            <div className="flex justify-between items-center px-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {activeTab === 'all' ? t.match_available : t.your_trips}
                <span className="ml-3 bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">{filteredTrips.length}</span>
              </h2>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                {t.mamadb_protected}
              </span>
            </div>

            {viewMode === 'map' && activeTab !== 'trains' ? (
              <MapView
                trips={activeTab === 'all'
                  ? trips.filter(t => t.seatsAvailable > 0)
                  : trips.filter(t => t.driverId === currentUser.id || (t.passengerIds && t.passengerIds.includes(currentUser.id)))}
                studyGroups={activeTab === 'all' ? studyGroups : studyGroups.filter(g => g.creatorId === currentUser.id || g.members.includes(currentUser.id))}
                onTripSelect={() => { }}
              />
            ) : filteredTrips.length > 0 || (activeTab === 'trains') ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    currentUser={currentUser}
                    onQuickBook={handleQuickBook}
                    onCancelParticipation={handleCancelParticipation}
                    onCancelTrip={handleCancelTrip}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="text-7xl mb-6 grayscale opacity-20">📭</div>
                <p className="text-slate-400 font-bold text-lg">{t.no_trips_found}</p>
                <button
                  onClick={() => { setActiveTab('all'); setSearchQuery(''); setSubjectFilter('all'); }}
                  className="mt-6 text-brand-600 font-black text-sm hover:underline"
                >
                  {t.reset_filters}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar: Leaderboard & Stats */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-32">
          <Leaderboard currentUserId={currentUser.id} />

          {/* Small promo card */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
            <h4 className="text-xl font-black mb-2 relative z-10">{t.pnrr_missions_title}</h4>
            <p className="text-indigo-100 text-xs font-medium relative z-10 leading-relaxed mb-4">
              {t.pnrr_missions_desc}
            </p>
            <button onClick={() => setIsHelpOpen(true)} className="bg-white text-indigo-900 px-4 py-2 rounded-xl text-xs font-black relative z-10">
              {t.learn_more}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
