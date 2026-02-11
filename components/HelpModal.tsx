
import React from 'react';
import { useLanguage } from '../i18n';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

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
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
          <h2 id="modal-title" className="text-xl font-bold flex items-center gap-2">
            <span>ℹ️</span> {t.help_title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors focus-ring"
            aria-label={t.close_guide}
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <section>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              {t.help_desc}
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">{t.pnrr_missions}</h3>

            <div className="flex gap-4">
              <span className="text-2xl shrink-0">🚗</span>
              <div>
                <h4 className="font-bold text-sm text-green-700">{t.mission_3_title}</h4>
                <p className="text-xs text-slate-500">{t.mission_3_desc}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-2xl shrink-0">📚</span>
              <div>
                <h4 className="font-bold text-sm text-blue-700">{t.mission_4_title}</h4>
                <p className="text-xs text-slate-500">{t.mission_4_desc}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="text-2xl shrink-0">♿</span>
              <div>
                <h4 className="font-bold text-sm text-orange-700">{t.mission_5_title}</h4>
                <p className="text-xs text-slate-500">{t.mission_5_desc}</p>
              </div>
            </div>
          </section>

          <section className="bg-slate-50 p-4 rounded-2xl">
            <h3 className="font-bold text-slate-800 text-sm mb-3">{t.quick_guides}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-2">
                  📖 {t.earn_credits_guide}
                </a>
              </li>
              <li>
                <a href="#" className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-2">
                  🛡️ {t.safety_trust_guide}
                </a>
              </li>
              <li>
                <a href="#" className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-2">
                  ♿ {t.inclusion_guide}
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors focus-ring"
          >
            {t.close_guide}
          </button>
        </div>
      </div>
    </div>
  );
};
