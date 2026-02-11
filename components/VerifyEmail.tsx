import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { useLanguage } from '../i18n';

interface VerifyEmailProps {
    token: string;
    onNavigate: (path: string) => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({ token, onNavigate }) => {
    const { t } = useLanguage();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const result = await db.verifyEmail(token);
                if (result.ok) {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setErrorMsg(result.error || 'Verification failed');
                }
            } catch (err) {
                setStatus('error');
                setErrorMsg('An unexpected error occurred');
            }
        };
        verify();
    }, [token]);

    return (
        <div className="min-h-screen glass-header flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 p-10 text-center">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-200">
                        <span className="text-white font-black text-3xl">✓</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Email Verification</h2>
                </div>

                {status === 'verifying' && (
                    <p className="text-slate-500 animate-pulse">Verifying your email...</p>
                )}

                {status === 'success' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 text-green-700 rounded-xl font-bold border border-green-100">
                            Email verified successfully!
                        </div>
                        <button
                            onClick={() => onNavigate('')}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                        >
                            Go to Login
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl font-bold border border-rose-100">
                            verification failed: {errorMsg}
                        </div>
                        <p className="text-xs text-slate-400">The link may be invalid or expired.</p>
                        <button
                            onClick={() => onNavigate('')}
                            className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-slate-200 transition-all"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
