import React, { useState } from 'react';
import { db } from '../db';
import { useLanguage } from '../i18n';

interface ResetPasswordProps {
    token: string;
    onNavigate: (path: string) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onNavigate }) => {
    const { t } = useLanguage();
    const [newPassword, setNewPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) return;

        setStatus('submitting');
        try {
            const result = await db.resetPassword(token, newPassword);
            if (result.ok) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMsg(result.error || 'Failed to reset password');
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg('An unexpected error occurred');
        }
    };

    return (
        <div className="min-h-screen glass-header flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 p-10">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-200">
                        <span className="text-white font-black text-3xl">↺</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Reset Password</h2>
                </div>

                {status === 'success' ? (
                    <div className="space-y-4 text-center">
                        <div className="p-4 bg-green-50 text-green-700 rounded-xl font-bold border border-green-100">
                            Password has been reset!
                        </div>
                        <button
                            onClick={() => onNavigate('')}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                        >
                            Go to Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {status === 'error' && (
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl font-bold border border-rose-100 text-sm">
                                Error: {errorMsg}
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                New Password
                            </label>
                            <input
                                required
                                type="password"
                                placeholder="Enter new password"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-brand-500 outline-none transition-all"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                disabled={status === 'submitting'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-sm tracking-widest hover:bg-slate-800 shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'submitting' ? 'Resetting...' : 'Set New Password'}
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigate('')}
                            className="w-full text-slate-400 py-2 text-xs font-bold hover:text-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
