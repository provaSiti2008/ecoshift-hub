import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { db } from './db';
import type { User } from './types';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  syncThemeWithUser: (user: User | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Applica il tema al DOM
  const applyTheme = useCallback((newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#f8fafc';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
    }
    localStorage.setItem('ecoshift_theme', newTheme);
  }, []);

  // Inizializzazione: carica da localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ecoshift_theme') as Theme;
    if (saved === 'light' || saved === 'dark') {
      setThemeState(saved);
      applyTheme(saved);
    } else {
      // Default a light
      setThemeState('light');
      applyTheme('light');
    }
  }, [applyTheme]);

  // Applica tema quando cambia
  useEffect(() => {
    applyTheme(theme);
    console.log('ThemeProvider: Tema cambiato a', theme);
    
    // Salva sul database se l'utente è loggato
    if (currentUserId) {
      db.updateUserTheme(currentUserId, theme).catch(err => {
        console.error('Errore nel salvare il tema sul database:', err);
      });
    }
  }, [theme, applyTheme, currentUserId]);

  const toggleTheme = () => {
    console.log('Toggle theme cliccato, tema attuale:', theme);
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Sincronizza tema con l'utente loggato
  const syncThemeWithUser = useCallback((user: User | null) => {
    if (user) {
      setCurrentUserId(user.id);
      // Se l'utente ha un tema preferito salvato, usalo
      if (user.theme === 'light' || user.theme === 'dark') {
        console.log('ThemeProvider: Tema caricato dal profilo utente:', user.theme);
        setThemeState(user.theme);
        applyTheme(user.theme);
      }
    } else {
      setCurrentUserId(null);
    }
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, syncThemeWithUser }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
