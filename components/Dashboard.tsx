
import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../i18n';
import { useTheme } from '../theme';
import { db } from '../db';
import { Trip, User, UserRole, StudyGroup, UserLocation } from '../types';
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
  userLocation?: UserLocation | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, isOfferModalOpen, setIsOfferModalOpen, onUserUpdate, userLocation }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
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
    setLastSync(new Date());
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
            .replace('{to}', trip.to || t.unknown_destination),
          read: false,
          type: 'success',
          timestamp: new Date().toISOString()
        });

        setBookingMessage({ text: t.booking_success.replace('{credits}', earnedCredits.toString()), type: 'success' });
        setTimeout(() => setBookingMessage(null), 3000);
        setLastSync(new Date());
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
          .replace('{to}', trip.to || t.unknown_destination),
        read: false,
        type: 'warning',
        timestamp: new Date().toISOString()
      });

      setBookingMessage({ text: t.participation_cancelled, type: 'error' });
      setTimeout(() => setBookingMessage(null), 3000);
      setLastSync(new Date());
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
          text: t.trip_cancelled_notification.replace('{to}', trip.to || t.unknown_destination),
          read: false,
          type: 'warning',
          timestamp: new Date().toISOString()
        });
      };
    }

    setBookingMessage({ text: t.commitment_removed, type: 'error' });
    setTimeout(() => setBookingMessage(null), 3000);
    setLastSync(new Date());
  };

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 animate-fade-in relative z-10">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <OfferRideModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        currentUser={currentUser}
        onTripCreated={loadData}
        onUserUpdate={onUserUpdate}
      />

      {/* Toast Notifications - Fixed on top of everything */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-none">
        {bookingMessage && (
          <div className={`px-6 py-4 rounded-2xl shadow-2xl font-bold text-white transition-all transform animate-in slide-in-from-top duration-300 flex items-center gap-3 backdrop-blur-xl border border-white/30 pointer-events-auto ${bookingMessage.type === 'success' ? 'bg-emerald-500/90' : 'bg-rose-500/90'
            }`}>
            <span className="text-xl">{bookingMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <p className="text-sm drop-shadow-md">{bookingMessage.text}</p>
          </div>
        )}
      </div>

      {/* Hero Header - Glass Card */}
      <header className="glass-panel rounded-3xl p-8 md:p-10 text-slate-800 dark:text-white shadow-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-accent-neon/10 dark:from-brand-500/20 dark:to-accent-neon/20 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-accent-neon dark:from-brand-300 dark:to-brand-100">
              {t.eco_profile}
            </h1>
            <p className="text-slate-500 dark:text-slate-300 font-medium text-lg">
              {t.welcome_user.replace('{name}', currentUser.name)}
            </p>
            <div className="pt-4 flex justify-center md:justify-start gap-4">
              <button
                onClick={() => setIsHelpOpen(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-all border border-slate-200 dark:border-white/10 flex items-center gap-2"
              >
                <span>💡</span> {t.how_it_works}
              </button>
              {lastSync && (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 self-center bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full">
                  {t.last_save.replace('{time}', lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-6 items-center">
            {/* Notification Bell */}
            <div className="relative group/notif z-50">
              <button className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 hover:scale-105 transition-transform">
                🔔
                <AsyncNotificationBadge userId={currentUser.id} />
              </button>

              {/* Dropdown */}
              <div className="absolute top-full right-0 mt-4 w-80 glass-panel bg-white/90 dark:bg-slate-900/90 rounded-3xl p-2 shadow-2xl opacity-0 invisible group-hover/notif:opacity-100 group-hover/notif:visible transition-all duration-200 z-[100] origin-top-right transform scale-95 group-hover/notif:scale-100">
                <AsyncNotificationList userId={currentUser.id} />
              </div>
            </div>

            {/* Credits Card */}
            <div className="hidden md:block glass-card p-6 min-w-[200px] text-center bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/20 border-none">
              <span
                key={currentUser.credits}
                className="block text-5xl font-black mb-1 drop-shadow-md animate-in zoom-in-95 duration-300"
              >
                {currentUser.credits}
              </span>
              <span className="uppercase text-[10px] font-bold tracking-[0.2em] opacity-90">{t.eco_credits}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Stats & Actions (Mobile only mostly) or Secondary Nav */}
        <div className="lg:col-span-8 space-y-6">

          {/* Navigation Tabs */}
          <div className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'all'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {t.explore_offers}
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'mine'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {t.my_commitments}
            </button>
            <button
              onClick={() => setActiveTab('trains')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'trains'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <span>🚆</span> {t.train_study}
            </button>
          </div>

          {/* Action Banner */}
          <section className="glass-panel p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-100 to-white dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner ring-1 ring-black/5">🚗</div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t.create_impact_title}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-md">{t.create_impact_desc}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOfferModalOpen(true)}
              className="btn-premium px-8 py-4 w-full md:w-auto text-sm"
            >
              {t.propose_trip_btn}
            </button>
          </section>

          {/* Filters & Content Area */}
          <div className="space-y-6">
            {activeTab === 'all' && (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg opacity-40">🔍</span>
                  <input
                    type="text"
                    placeholder={t.search_placeholder}
                    className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500/50 outline-none transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-auto">
                  <SubjectDropdown
                    subjects={availableSubjects}
                    selectedSubject={subjectFilter}
                    onSelect={setSubjectFilter}
                  />
                </div>
                <button
                  onClick={() => setAccessibilityOnly(!accessibilityOnly)}
                  className={`px-6 py-4 rounded-2xl text-sm font-bold transition-all border flex items-center justify-center gap-2 whitespace-nowrap ${accessibilityOnly
                    ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-orange-300'
                    }`}
                >
                  <span className="text-lg">♿</span>
                  <span className="hidden md:inline">{t.support_m5}</span>
                </button>
                <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl flex gap-1 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-xl text-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                    title={t.list_view}
                  >
                    📝
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-4 py-2 rounded-xl text-lg transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
                    title={t.map_view}
                  >
                    🗺️
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'trains' && (
              <TrainStudySection currentUser={currentUser} />
            )}

            {activeTab !== 'trains' && (
              <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
                  {activeTab === 'all' ? t.match_available : t.your_trips}
                  <span className="bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 text-xs px-2.5 py-1 rounded-full font-bold">{filteredTrips.length}</span>
                </h2>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50">
                  {t.mamadb_protected}
                </span>
              </div>
            )}

            {viewMode === 'map' && activeTab !== 'trains' ? (
              <div className="rounded-3xl overflow-hidden glass-panel border-4 border-white dark:border-slate-700 shadow-2xl h-[500px]">
                <MapView
                  trips={activeTab === 'all'
                    ? trips.filter(t => t.seatsAvailable > 0)
                    : trips.filter(t => t.driverId === currentUser.id || (t.passengerIds && t.passengerIds.includes(currentUser.id)))}
                  studyGroups={activeTab === 'all' ? studyGroups : studyGroups.filter(g => g.creatorId === currentUser.id || g.members.includes(currentUser.id))}
                  onTripSelect={() => { }}
                  userLocation={userLocation}
                />
              </div>
            ) : filteredTrips.length > 0 || (activeTab === 'trains') ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredTrips.map((trip) => (
                  <div key={trip.id} className="transform transition-all hover:scale-[1.01]">
                    <TripCard
                      trip={trip}
                      currentUser={currentUser}
                      onQuickBook={handleQuickBook}
                      onCancelParticipation={handleCancelParticipation}
                      onCancelTrip={handleCancelTrip}
                    // Pass styling prop if TripCard supports it, or rely on global CSS override 
                    // Actually TripCard needs to be updated too for full glassmorphism, 
                    // but wrapping it here might be enough for layout.
                    />
                  </div>
                ))}
              </div>
            ) : activeTab !== 'trains' && (
              <div className="text-center py-24 glass-panel rounded-[3rem]">
                <div className="text-6xl mb-6 grayscale opacity-20">📭</div>
                <p className="text-slate-400 font-bold text-lg">{t.no_trips_found}</p>
                <button
                  onClick={() => { setActiveTab('all'); setSearchQuery(''); setSubjectFilter('all'); }}
                  className="mt-6 text-brand-600 dark:text-brand-400 font-black text-sm hover:underline"
                >
                  {t.reset_filters}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-32 h-fit">
          <Leaderboard currentUserId={currentUser.id} />

          {/* Promo Card */}
          <div className="glass-card p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden group hover:shadow-neon transition-all duration-500">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-all"></div>
            <div className="absolute bottom-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            <h4 className="text-2xl font-black mb-3 relative z-10">{t.pnrr_missions_title}</h4>
            <p className="text-indigo-100 text-sm font-medium relative z-10 leading-relaxed mb-6">
              {t.pnrr_missions_desc}
            </p>
            <button onClick={() => setIsHelpOpen(true)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-xl text-xs font-bold relative z-10 transition-all">
              {t.learn_more} →
            </button>
          </div>
        </div>

      </div>
    </main>
  );
};
