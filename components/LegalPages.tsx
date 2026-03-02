
import React, { useState } from 'react';
import { useLanguage } from '../i18n';

export type LegalPageType = 'about' | 'privacy' | 'terms' | 'contact';

interface LegalPagesProps {
  activePage: LegalPageType | null;
  onClose: () => void;
}

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

export const LegalPages: React.FC<LegalPagesProps> = ({ activePage, onClose }) => {
  const { t } = useLanguage();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!activePage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendStatus(null);

    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });

      const data = await response.json();

      if (response.ok) {
        setSendStatus({ success: true, message: t.success });
        setContactForm({ name: '', email: '', message: '' });
      } else {
        setSendStatus({ success: false, message: data.error || t.error });
      }
    } catch (err) {
      setSendStatus({ success: false, message: t.error });
    } finally {
      setIsSending(false);
    }
  };

  const renderAbout = () => (
    <div className="space-y-4">
      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
        {t.about_content}
      </p>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
        <h4 className="font-bold text-green-700 dark:text-green-400 text-sm mb-2">🌱 Missione Ambientale</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Riduciamo l'impatto ambientale promuovendo il carpooling tra studenti universitari.
        </p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
        <h4 className="font-bold text-blue-700 dark:text-blue-400 text-sm mb-2">🎓 Inclusione Accademica</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Crediamo nel potere della community per creare opportunità di studio e condivisione.
        </p>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">{t.privacy_data_title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">{t.privacy_data_desc}</p>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">{t.privacy_usage_title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">{t.privacy_usage_desc}</p>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">{t.privacy_security_title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">{t.privacy_security_desc}</p>
      </div>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
        <h4 className="font-bold text-green-700 dark:text-green-400 text-sm mb-2">✓ {t.privacy_rights_title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">{t.privacy_rights_desc}</p>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">📋 {t.terms_title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">{t.terms_acceptance}</p>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">⚠️ {t.terms_obligations}</h4>
        <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
          <li>Fornire dati veritieri e accurati</li>
          <li>Mantenere comportamento rispettoso</li>
          <li>Seguire le linee guida della community</li>
        </ul>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">🛡️ {t.terms_responsibility}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">{t.terms_responsibility}</p>
      </div>
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
        <h4 className="font-bold text-red-700 dark:text-red-400 text-sm mb-2">🚫 {t.terms_limitations}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">{t.terms_limitations}</p>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">📧 {t.contact_email}</h4>
        <a href="mailto:Iltuositoweb@outlook.it" className="text-brand-600 dark:text-brand-400 text-sm hover:underline">
          Iltuositoweb@outlook.it
        </a>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t.contact_form}</h4>
        
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">{t.contact_name}</label>
          <input
            type="text"
            value={contactForm.name}
            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Email</label>
          <input
            type="email"
            value={contactForm.email}
            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            placeholder={t.contact_email_placeholder}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">{t.contact_message}</label>
          <textarea
            value={contactForm.message}
            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isSending}
          className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? t.submitting : t.contact_send}
        </button>

        {sendStatus && (
          <div className={`p-3 rounded-xl text-sm text-center ${sendStatus.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
            {sendStatus.success ? '✓ ' + (t.success || 'Messaggio inviato!') : '✗ ' + (sendStatus.message || t.error)}
          </div>
        )}
      </form>
      
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
        ⏱️ {t.contact_response_time}
      </p>
    </div>
  );

  const getTitle = () => {
    switch (activePage) {
      case 'about': return t.about_title;
      case 'privacy': return t.privacy_title;
      case 'terms': return t.terms_title;
      case 'contact': return t.contact_title;
      default: return '';
    }
  };

  const getIcon = () => {
    switch (activePage) {
      case 'about': return '🏛️';
      case 'privacy': return '🔒';
      case 'terms': return '📄';
      case 'contact': return '📬';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <div className="bg-brand-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h2 id="legal-modal-title" className="text-xl font-bold flex items-center gap-2">
            <span>{getIcon()}</span> {getTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors focus-ring"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activePage === 'about' && renderAbout()}
          {activePage === 'privacy' && renderPrivacy()}
          {activePage === 'terms' && renderTerms()}
          {activePage === 'contact' && renderContact()}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 dark:bg-slate-700 text-white py-2.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors focus-ring text-sm"
          >
            {t.close_guide}
          </button>
        </div>
      </div>
    </div>
  );
};
