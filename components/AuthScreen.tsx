import React, { useState } from 'react';
import { useLanguage } from '../i18n';
import { db } from '../db';
import { User, UserRole } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const { t } = useLanguage();
  const [view, setView] = useState<'login' | 'register'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BOTH);

  // Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const clearState = () => {
    setError('');
    setSuccessMsg('');
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) return;

    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const users = await db.getUsers();
      const user = users.find(u => u.id === normalizedEmail);

      if (user) {
        // Password check (client-side for prototype)
        if (user.password && user.password !== password) {
          setError(t.auth_error_password);
          setLoading(false);
          return;
        }

        db.setSession(user);
        onLoginSuccess(user);
      } else {
        setError(t.auth_error_not_found);
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password || !name) return;

    setLoading(true);
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Check existence locally first (optimistic)
      const users = await db.getUsers();
      if (users.find(u => u.id === normalizedEmail)) {
        setError(t.auth_error_exists);
        setLoading(false);
        return;
      }

      const newUser: User = {
        id: normalizedEmail,
        name: name,
        role: role,
        skills: [],
        accessibilityNeeds: [],
        credits: 500,
        password: password
      };

      const result = await db.register(newUser);

      if (result.ok) {
        // Auto-login after registration
        db.setSession(newUser);
        onLoginSuccess(newUser);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (view === 'login') {
      await handleLogin(e);
    } else {
      await handleSignup(e);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[100px] animate-float opacity-60"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent-neon/20 rounded-full blur-[100px] animate-pulse-slow opacity-60"></div>
        <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] bg-accent-gold/10 rounded-full blur-[80px] animate-float opacity-40 delay-1000"></div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative z-10 animate-fade-in-up">

        {/* Left Col: Visuals (Hidden on mobile sometimes, but let's keep it for premium feel) */}
        <div className="relative overflow-hidden p-10 flex flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-800 text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-lg">
              <span className="text-white font-black text-3xl italic">E</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">
              {t.app_name}
            </h1>
            <p className="text-brand-100 font-medium text-lg max-w-xs leading-relaxed">
              {t.auth_subtitle}
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
              <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">{t.auth_pnrr_contribution}</p>
              <p className="text-xl font-bold">{t.auth_pnrr_missions}</p>
            </div>
          </div>
        </div>

        {/* Right Col: Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-white/50 dark:bg-transparent">
          <div className="mb-8">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
              <button
                onClick={() => { setView('login'); clearState(); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${view === 'login'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                {t.login_tab}
              </button>
              <button
                onClick={() => { setView('register'); clearState(); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${view === 'register'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                {t.register_tab}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-xs font-bold mb-6 border border-rose-100 dark:border-rose-900/30 flex items-center gap-3 animate-pulse">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold mb-6 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3">
              <span className="text-lg">✓</span>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {view === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.full_name}</label>
                <input
                  required
                  type="text"
                  placeholder="Mario Rossi"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.uni_email}</label>
              <input
                required
                type="email"
                placeholder="nome.cognome@polimi.it"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.password}</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {view === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.default_role}</label>
                <div className="relative">
                  <select
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all appearance-none cursor-pointer"
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                  >
                    <option value={UserRole.BOTH}>{t.role_both}</option>
                    <option value={UserRole.DRIVER}>{t.role_driver}</option>
                    <option value={UserRole.PASSENGER}>{t.role_passenger}</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full py-5 mt-6 text-sm tracking-widest uppercase shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:grayscale"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {t.loading}
                </span>
              ) : (view === 'login' ? t.login_action : t.register_action)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
