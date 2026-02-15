
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

const App: React.FC = () => {
  const { t } = useLanguage();
  const { theme, toggleTheme, syncThemeWithUser } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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

  // Sincronizza tema con l'utente loggato
  useEffect(() => {
    syncThemeWithUser(currentUser);
  }, [currentUser, syncThemeWithUser]);

  useEffect(() => {
    const initApp = async () => {
      try {
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
        color: theme === 'dark' ? '#f8fafc' : '#000000'
      }}
    >
      <nav 
        className="border-b sticky top-0 z-[100] px-4 py-3 transition-colors duration-300"
        style={{
          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
          borderColor: theme === 'dark' ? '#334155' : '#e2e8f0'
        }}
      >
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xl">E</span>
            </div>
            <span 
              className="font-bold text-xl tracking-tight"
              style={{ color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}
            >
              {t.app_name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button
              onClick={() => {
                console.log('Pulsante tema cliccato!');
                toggleTheme();
              }}
              className="text-[10px] font-bold text-slate-400 hover:text-brand-600 transition-colors flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-300 hover:border-brand-300"
              title={theme === 'light' ? 'Attiva modalità scura' : 'Attiva modalità chiara'}
            >
              <span className="text-lg">{theme === 'light' ? '🌙' : '☀️'}</span>
              <span className="hidden sm:inline">{theme === 'light' ? 'Scuro' : 'Chiaro'}</span>
            </button>
            {userLocation ? (
              <div className="flex items-center gap-1 text-emerald-600" title="Posizione attiva">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold hidden sm:inline">GPS</span>
              </div>
            ) : locationPermission === 'denied' ? (
              <button
                onClick={requestUserLocation}
                className="text-[10px] font-bold text-slate-400 dark:text-slate-300 hover:text-emerald-600 transition-colors flex items-center gap-1"
                title="Attiva posizione"
              >
                <span>📍</span>
                <span className="hidden sm:inline">Attiva GPS</span>
              </button>
            ) : (
              <button
                onClick={requestUserLocation}
                className="text-[10px] font-bold text-slate-400 dark:text-slate-300 hover:text-emerald-600 transition-colors flex items-center gap-1"
                title="Attiva posizione"
              >
                <span>📍</span>
                <span className="hidden sm:inline">Attiva GPS</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-[10px] font-black text-slate-400 dark:text-slate-300 hover:text-rose-600 transition-colors uppercase tracking-widest mr-2"
              aria-label={t.logout}
            >
              {t.logout}
            </button>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="focus-ring rounded-full overflow-hidden transition-transform active:scale-90"
              aria-label={t.open_profile}
            >
              <img
                src={`https://picsum.photos/seed/${currentUser.id}/32/32`}
                alt={t.my_profile}
                className="w-8 h-8 rounded-full border border-slate-300 object-cover"
              />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto">
        <Dashboard
          currentUser={currentUser}
          isOfferModalOpen={isOfferModalOpen}
          setIsOfferModalOpen={setIsOfferModalOpen}
          onUserUpdate={handleUserUpdate}
          userLocation={userLocation}
        />
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onUpdate={handleUserUpdate}
      />

      <footer 
        className="border-t md:hidden sticky bottom-0 z-50 transition-colors duration-300"
        style={{
          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
          borderColor: theme === 'dark' ? '#334155' : '#e2e8f0'
        }}
      >
        <div className="flex justify-around p-3">
          <button className="flex flex-col items-center text-brand-600" aria-label={t.home}>
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold">{t.home}</span>
          </button>
          <button
            onClick={() => setIsOfferModalOpen(true)}
            className="flex flex-col items-center text-brand-600 font-bold"
            aria-label={t.create_trip_aria}
          >
            <span className="text-2xl bg-brand-50 dark:bg-brand-900 p-2 rounded-full mb-1">➕</span>
            <span className="text-[10px]">{t.create}</span>
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex flex-col items-center text-slate-400 dark:text-slate-300"
            aria-label={t.profile}
          >
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-bold">{t.profile}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
