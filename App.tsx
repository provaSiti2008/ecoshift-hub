
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from './i18n';
import { useTheme } from './theme';
import { LanguageSelector } from './components/LanguageSelector';
import { Dashboard } from './components/Dashboard';
import { User, UserLocation } from './types';
import { db } from './db';
import { MOCK_DRIVER_IDS } from './constants';
import { ProfileModal } from './components/ProfileModal';
import { AuthScreen } from './components/AuthScreen';
import { migrateStationNames, isMigrationDone, markMigrationDone } from './migrate-stations';

const App: React.FC = () => {
  const { t } = useLanguage();
  const { theme, toggleTheme, syncThemeWithUser } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');

  // Custom parsing for hash routing (e.g. #verify-email?token=...)
  const [currentRoute, setCurrentRoute] = useState(window.location.hash);
  const [routeParams, setRouteParams] = useState<URLSearchParams>(new URLSearchParams());

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const [path, query] = hash.split('?');
      setCurrentRoute(path);
      setRouteParams(new URLSearchParams(query));
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (path: string) => {
    window.location.hash = path;
  };

  const handleUserUpdate = useCallback((updatedUser: User) => {
    setCurrentUser(updatedUser);
    db.setSession(updatedUser);
  }, []);

  const handleViewProfile = useCallback(async (userId: string) => {
    try {
      const users = await db.getUsers();
      const user = users.find(u => u.id === userId);
      if (user) {
        setViewedUser(user);
        setIsProfileModalOpen(true);
      }
    } catch (err) {
      console.error('Error viewing profile:', err);
    }
  }, []);

  // Sincronizza tema con l'utente loggato
  useEffect(() => {
    syncThemeWithUser(currentUser);
  }, [currentUser, syncThemeWithUser]);

  useEffect(() => {
    const initApp = async () => {
      try {
        // 0. Migrazione nomi stazioni (una sola volta)
        if (!isMigrationDone()) {
          await migrateStationNames();
          markMigrationDone();
        }

        // 1. Archiviazione automatica viaggi scaduti (pulizia del database)
        const allTrips = await db.getTrips();
        const now = new Date();
        const expiredTrips = allTrips.filter(t => new Date(t.departureTime) < now);
        for (const trip of expiredTrips) {
          await db.deleteTrip(trip.id);
          console.log(`[App] Viaggio scaduto archiviato e rimosso: ${trip.id}`);
        }

        // 2. Archiviazione automatica gruppi di studio scaduti
        const allGroups = await db.getStudyGroups();
        const expiredGroups = allGroups.filter(g => {
          // Se departureTime è in formato orario (es. "14:30"), confronta con l'orario corrente
          if (g.departureTime && g.departureTime.match(/^\d{2}:\d{2}$/)) {
            const [hours, minutes] = g.departureTime.split(':').map(Number);
            const groupTime = hours * 60 + minutes;
            const currentTime = now.getHours() * 60 + now.getMinutes();
            return groupTime < currentTime;
          }
          // Altrimenti tratta come data ISO completa
          return new Date(g.departureTime) < now;
        });
        for (const group of expiredGroups) {
          await db.deleteStudyGroup(group.id);
          console.log(`[App] Gruppo di studio scaduto archiviato e rimosso: ${group.id}`);
        }

        // 3. Elimina dal database i viaggi creati da utenti finti (demo) e il viaggio di "test user"
        const isTestUser = (t: { driverId: string; driverName?: string }) =>
          MOCK_DRIVER_IDS.includes(t.driverId) ||
          (t.driverName || '').trim().toLowerCase() === 'test user';
        const toDelete = allTrips.filter(isTestUser);
        for (const trip of toDelete) {
          await db.deleteTrip(trip.id);
        }

        const sessionUser = db.getCurrentSession();
        if (sessionUser) {
          setCurrentUser(sessionUser);

          // Rinfresca i dati dal server per avere i crediti aggiornati subito
          const users = await db.getUsers();
          const latest = users.find(u => u.id === sessionUser.id);
          if (latest) {
            handleUserUpdate(latest);
          }

          // Richiedi geolocalizzazione se l'utente è già loggato
          requestUserLocation();
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    let syncTimeout: any = null;

    const handleSync = () => {
      if (syncTimeout) clearTimeout(syncTimeout);

      syncTimeout = setTimeout(async () => {
        const sessionUser = db.getCurrentSession();
        if (sessionUser) {
          try {
            const users = await db.getUsers();
            const latest = users.find(u => u.id === sessionUser.id);
            if (latest) {
              setCurrentUser(prev => {
                // Prevenzione: non sovrascrivere mai con dati più vecchi (meno crediti)
                if (prev && prev.id === latest.id && latest.credits < prev.credits) {
                  return prev;
                }
                // Aggiorna la sessione solo se i dati sono nuovi o coerenti
                db.setSession(latest);
                return latest;
              });
            }
          } catch (error) {
            console.error("Sync fetch failed:", error);
          }
        }
      }, 300); // Ridotto a 300ms per maggiore reattività
    };

    window.addEventListener('ecoshift-sync', handleSync);
    return () => {
      window.removeEventListener('ecoshift-sync', handleSync);
      if (syncTimeout) clearTimeout(syncTimeout);
    };
  }, [currentUser?.id]); // Ricollega se cambia l'utente

  // Richiedi geolocalizzazione
  const requestUserLocation = () => {
    console.log('[App] Richiesta geolocalizzazione...');
    if (!navigator.geolocation) {
      console.log('[App] Geolocalizzazione non supportata dal browser');
      setLocationPermission('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setUserLocation(location);
        setLocationPermission('granted');
        console.log('[App] Posizione utente ottenuta:', location);
      },
      (error) => {
        console.log('[App] Permesso geolocalizzazione negato o errore:', error.message);
        setLocationPermission('denied');
        setUserLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Richiedi geolocalizzazione quando l'utente è loggato (ma attendi un po' per l'interazione)
  useEffect(() => {
    if (currentUser && !userLocation && locationPermission === 'pending') {
      // Piccolo ritardo per assicurarsi che il browser sia pronto
      const timer = setTimeout(() => {
        requestUserLocation();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, userLocation, locationPermission]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    db.setSession(user);
    // Richiedi geolocalizzazione dopo il login
    requestUserLocation();
    // Clear hash if any
    if (window.location.hash) {
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
    }
  };

  const handleLogout = () => {
    db.setSession(null);
    setCurrentUser(null);
    setUserLocation(null);
    setLocationPermission('pending');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500 overflow-hidden font-sans selection:bg-brand-500/30">
      {/* Ambient Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-400/20 rounded-full blur-[128px] animate-float opacity-70" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-neon/10 rounded-full blur-[128px] animate-pulse-slow opacity-60" />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-accent-gold/5 rounded-full blur-[96px] animate-float opacity-40 delay-1000" />
      </div>

      {/* Floating Navigation (Dock Style) */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 animate-fade-in-up">
        <nav className="glass-panel w-full max-w-5xl rounded-full px-6 py-3 flex items-center justify-between shadow-2xl ring-1 ring-white/20 dark:ring-white/5">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity rounded-full"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-xl">E</span>
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white hidden sm:block">
              {t.app_name}
            </span>
          </div>

          {/* Center Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            <LanguageSelector />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative w-14 h-8 bg-slate-200 dark:bg-slate-700 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              aria-label="Toggle Theme"
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center text-xs ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </div>
            </button>

            {/* GPS Status */}
            {userLocation ? (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 group cursor-help">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold">GPS ON</span>
              </div>
            ) : (
              <button
                onClick={requestUserLocation}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400 text-[10px] font-bold"
              >
                <span className="text-sm">📍</span>
                <span>{t.enable_gps || 'Enable GPS'}</span>
              </button>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="hidden md:block text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-wider"
            >
              {t.logout}
            </button>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="relative group focus:outline-none"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-400 to-accent-neon rounded-full blur opacity-0 group-hover:opacity-75 transition-opacity"></div>
              <img
                src={`https://picsum.photos/seed/${currentUser.id}/40/40`}
                alt={t.profile}
                className="relative w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 object-cover shadow-sm group-hover:scale-105 transition-transform"
              />
            </button>
          </div>
        </nav>
      </div>

{/* Main Content Area */}
      <div className="relative z-10 pt-28 pb-32 md:pb-16 h-screen overflow-y-auto no-scrollbar scroll-smooth">
        <Dashboard
          currentUser={currentUser}
          isOfferModalOpen={isOfferModalOpen}
          setIsOfferModalOpen={setIsOfferModalOpen}
          onUserUpdate={handleUserUpdate}
          userLocation={userLocation}
          onViewProfile={handleViewProfile}
        />
      </div>

      {/* Mobile Bottom Navigation (Glass) */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 animate-fade-in-up delay-200">
        <nav className="glass-panel rounded-2xl p-2 flex justify-around items-center shadow-2xl ring-1 ring-white/20 dark:ring-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <button
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-brand-600 dark:text-brand-400 active:scale-95 transition-transform"
            onClick={() => handleNavigate('')}
          >
            <span className="text-2xl drop-shadow-sm">🏠</span>
            <span className="text-[10px] font-bold">{t.home}</span>
            <div className="w-1 h-1 bg-brand-500 rounded-full mt-1"></div>
          </button>

          <button
            onClick={() => setIsOfferModalOpen(true)}
            className="flex flex-col items-center justify-center -mt-8"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-accent-neon rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30 text-white transform active:scale-90 transition-transform border-4 border-slate-50 dark:border-slate-900">
              <span className="text-2xl font-bold">+</span>
            </div>
            <span className="text-[10px] font-bold mt-2 text-slate-600 dark:text-slate-300">{t.create}</span>
          </button>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-transform"
          >
            <span className="text-2xl">👤</span>
            <span className="text-[10px] font-bold">{t.profile}</span>
          </button>
        </nav>
      </div>

{/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => { setIsProfileModalOpen(false); setViewedUser(null); }}
        user={viewedUser || currentUser}
        onUpdate={viewedUser ? undefined : handleUserUpdate}
        isOwnProfile={!viewedUser}
        currentUserId={currentUser?.id}
      />

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 py-3 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-brand-600 dark:text-brand-400">{t.footer_pnrr}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>{t.footer_copyright}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{t.footer_about}</a>
            <a href="#privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{t.footer_privacy}</a>
            <a href="#terms" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{t.footer_terms}</a>
            <a href="#contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{t.footer_contact}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
