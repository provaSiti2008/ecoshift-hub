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
    <div className="min-h-screen glass-header flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-200">
              <span className="text-white font-black text-3xl italic">E</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t.app_name}</h1>
            <p className="text-slate-400 text-sm font-medium mt-2">{t.auth_subtitle}</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button
              onClick={() => { setView('login'); clearState(); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${view === 'login' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400'}`}
            >
              {t.login_tab}
            </button>
            <button
              onClick={() => { setView('register'); clearState(); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${view === 'register' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400'}`}
            >
              {t.register_tab}
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold mb-6 border border-rose-100 flex flex-col gap-2 animate-pulse">
              <div className="flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-xs font-bold mb-6 border border-green-100 flex items-center gap-2">
              <span>✓</span> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {view === 'register' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t.full_name}</label>
                <input
                  required
                  type="text"
                  placeholder="Mario Rossi"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-brand-500 outline-none transition-all"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t.uni_email}</label>
              <input
                required
                type="email"
                placeholder="nome.cognome@polimi.it"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-brand-500 outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t.password}</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-brand-500 outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {view === 'register' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t.default_role}</label>
                <select
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-brand-500 outline-none transition-all"
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                >
                  <option value={UserRole.BOTH}>{t.role_both}</option>
                  <option value={UserRole.DRIVER}>{t.role_driver}</option>
                  <option value={UserRole.PASSENGER}>{t.role_passenger}</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-sm tracking-widest hover:bg-slate-800 shadow-xl transition-all active:scale-95 mt-4 disabled:opacity-50"
            >
              {loading ? t.loading : (view === 'login' ? t.login_action : t.register_action)}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 font-bold mt-8 uppercase tracking-widest leading-relaxed">
            {t.auth_pnrr_contribution} <br />
            <span className="text-brand-600">{t.auth_pnrr_missions}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
