import React, { useState } from 'react';
import { useLanguage } from '../i18n';
import { db } from '../db';
import { User, UserRole } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const { t } = useLanguage();
  const [view, setView] = useState<'login' | 'register' | 'verify' | 'forgot-password' | 'reset-password'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BOTH);

  // OTP verification
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [isMockMode, setIsMockMode] = useState(false);

  // Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const clearState = () => {
    setError('');
    setSuccessMsg('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setPendingEmail('');
    setIsMockMode(false);
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
      const result = await db.sendOTP(normalizedEmail, name, role, password);
      
      if (result.ok) {
        setPendingEmail(normalizedEmail);
        setIsMockMode(!!result.mock || !!result.devCode);
        setView('verify');
        if (result.devCode) {
          setSuccessMsg(`Codice OTP (test): ${result.devCode}`);
          setOtpCode(result.devCode);
        } else if (result.mock) {
          setSuccessMsg('Modalità sviluppo: controlla la console del server per il codice OTP');
        } else if (result.emailError) {
          setSuccessMsg('Email non inviata. Usa il codice mostrato qui sotto.');
        } else {
          setSuccessMsg('Codice inviato alla tua email');
        }
      } else {
        if (result.error === 'EMAIL_EXISTS') {
          setError(t.auth_error_exists);
        } else {
          setError(result.error || 'Failed to send verification code');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!otpCode || otpCode.length !== 6) {
      setError('Inserisci un codice a 6 cifre');
      return;
    }

    setLoading(true);
    try {
      const result = await db.verifyOTP(pendingEmail, otpCode);
      
      if (result.ok && result.user) {
        db.setSession(result.user);
        onLoginSuccess(result.user);
      } else {
        if (result.error === 'INVALID_CODE') {
          setError('Codice non valido');
        } else if (result.error === 'CODE_EXPIRED') {
          setError('Codice scaduto, richiedi un nuovo codice');
        } else {
          setError(result.error || 'Verification failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await db.resendOTP(pendingEmail);
      if (result.ok) {
        setSuccessMsg('Nuovo codice inviato!');
        if (result.mock) {
          setSuccessMsg('Modalità sviluppo: controlla la console del server per il codice OTP');
        }
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (err: any) {
      setError(err.message || 'Resend error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) return;

    setLoading(true);
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const result = await db.forgotPassword(normalizedEmail);
      
      if (result.ok) {
        setPendingEmail(normalizedEmail);
        setIsMockMode(!!result.mock || !!result.devCode);
        setView('reset-password');
        if (result.devCode) {
          setSuccessMsg(`Codice OTP (test): ${result.devCode}`);
          setOtpCode(result.devCode);
        } else {
          setSuccessMsg('Codice inviato alla tua email');
        }
      } else {
        if (result.error === 'EMAIL_NOT_FOUND') {
          setError('Nessun account associato a questa email');
        } else {
          setError(result.error || 'Failed to send reset code');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Inserisci un codice a 6 cifre');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('La password deve avere almeno 6 caratteri');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setLoading(true);
    try {
      const result = await db.resetPassword(pendingEmail, otpCode, newPassword);
      
      if (result.ok) {
        setSuccessMsg('Password aggiornata con successo!');
        setTimeout(() => {
          setView('login');
          clearState();
        }, 1500);
      } else {
        if (result.error === 'INVALID_CODE') {
          setError('Codice non valido');
        } else if (result.error === 'CODE_EXPIRED') {
          setError('Codice scaduto, richiedi un nuovo codice');
        } else {
          setError(result.error || 'Reset failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Reset error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (view === 'login') {
      await handleLogin(e);
    } else if (view === 'register') {
      await handleSignup(e);
    } else if (view === 'verify') {
      await handleVerifyOTP(e);
    } else if (view === 'forgot-password') {
      await handleForgotPassword(e);
    } else if (view === 'reset-password') {
      await handleResetPassword(e);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[100px] animate-float opacity-60"></div>
        <div className="absolute bottom-[-20%] right: [-10%] w-[600px] h-[600px] bg-accent-neon/20 rounded-full blur-[100px] animate-pulse-slow opacity:60"></div>
        <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] bg-accent-gold/10 rounded-full blur-[80px] animate-float opacity-40 delay-1000"></div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative z-10 animate-fade-in-up">

        {/* Left Col: Visuals */}
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
          {view !== 'verify' && view !== 'reset-password' && view !== 'forgot-password' && (
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
          )}

          {(view === 'verify' || view === 'reset-password' || view === 'forgot-password') && (
            <div className="mb-6">
              <button
                onClick={() => { setView(view === 'reset-password' ? 'forgot-password' : 'login'); clearState(); }}
                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-2"
              >
                ← Indietro
              </button>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-4">
                {view === 'verify' ? 'Verifica Email' : view === 'forgot-password' ? 'Password Dimenticata' : 'Reimposta Password'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                {view === 'forgot-password' 
                  ? 'Inserisci la tua email per ricevere un codice di reset'
                  : <>Abbiamo inviato un codice a <span className="font-semibold">{pendingEmail}</span></>
                }
              </p>
              {isMockMode && (
                <p className="text-amber-600 dark:text-amber-400 text-xs mt-2 font-semibold">
                  Modalità sviluppo: il codice viene mostrato sopra
                </p>
              )}
            </div>
          )}

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
            {view === 'verify' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Codice di verifica</label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-bold text-center tracking-[0.5em] text-slate-800 dark:text-white placeholder:text-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="btn-premium w-full py-5 mt-6 text-sm tracking-widest uppercase shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:grayscale"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Verifica...
                    </span>
                  ) : 'Verifica'}
                </button>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-sm text-brand-600 hover:text-brand-700 font-semibold"
                  >
                    Non hai ricevuto il codice? Invia di nuovo
                  </button>
                </div>
              </>
            )}

            {view === 'forgot-password' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email</label>
                  <input
                    required
                    type="email"
                    placeholder="nome.cognome@polimi.it"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="btn-premium w-full py-5 mt-6 text-sm tracking-widest uppercase shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:grayscale"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Invio...
                    </span>
                  ) : 'Invia codice'}
                </button>
              </>
            )}

            {view === 'reset-password' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Codice di verifica</label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-bold text-center tracking-[0.5em] text-slate-800 dark:text-white placeholder:text-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nuova Password</label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Conferma Password</label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6 || !newPassword || !confirmPassword}
                  className="btn-premium w-full py-5 mt-6 text-sm tracking-widest uppercase shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:grayscale"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Reimposta...
                    </span>
                  ) : 'Reimposta Password'}
                </button>
              </>
            )}

            {(view === 'login' || view === 'register') && (
              <>
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

                {view === 'login' && (
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => { setView('forgot-password'); clearState(); }}
                      className="text-sm text-brand-600 hover:text-brand-700 font-semibold"
                    >
                      Password dimenticata?
                    </button>
                  </div>
                )}
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
