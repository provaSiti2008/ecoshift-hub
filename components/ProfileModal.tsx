
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { User, UserRole } from '../types';
import { useLanguage } from '../i18n';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (user: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: user.name,
    role: user.role,
    skills: user.skills,
    accessibilityNeeds: user.accessibilityNeeds || [],
  });
  const [newSkill, setNewSkill] = useState('');
  const [newNeed, setNewNeed] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name,
        role: user.role,
        skills: user.skills,
        accessibilityNeeds: user.accessibilityNeeds || [],
      });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const updated = await db.updateUser(user.id, {
      ...formData
    });
    if (updated) {
      onUpdate(updated);
      onClose();
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const addNeed = () => {
    if (newNeed.trim() && !formData.accessibilityNeeds.includes(newNeed.trim())) {
      setFormData({ ...formData, accessibilityNeeds: [...formData.accessibilityNeeds, newNeed.trim()] });
      setNewNeed('');
    }
  };

  const removeNeed = (need: string) => {
    setFormData({ ...formData, accessibilityNeeds: formData.accessibilityNeeds.filter(n => n !== need) });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black">{t.eco_identity}</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.mama_db_desc}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center">✕</button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto">
          {/* Informazioni Base */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.base_info}</h3>
            <div className="grid grid-cols-1 gap-4">
              <input
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus-ring font-bold"
                placeholder={t.name_placeholder}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              <select
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus-ring font-bold"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <option value="both">{t.role_flexible}</option>
                <option value="driver">{t.role_driver_only}</option>
                <option value="passenger">{t.role_passenger_only}</option>
              </select>
            </div>
          </section>

          {/* Peer Tutoring Skills */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.expertise}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.skills.map(skill => (
                <span key={skill} className="bg-brand-50 text-brand-700 px-4 py-2 rounded-xl text-sm font-bold border border-brand-100 flex items-center gap-2">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-brand-900">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 px-6 py-4 bg-slate-100 border-none rounded-2xl focus-ring text-sm text-slate-900 placeholder:text-slate-400"
                placeholder={t.add_subject}
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-6 bg-slate-900 text-white rounded-2xl font-black text-xs"
              >
                {t.add_btn}
              </button>
            </div>
          </section>

          {/* Mission 5: Accessibility Needs */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.accessibility_needs}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.accessibilityNeeds.map(need => (
                <span key={need} className="bg-rose-50 text-rose-700 px-4 py-2 rounded-xl text-sm font-bold border border-rose-100 flex items-center gap-2">
                  {need}
                  <button onClick={() => removeNeed(need)} className="hover:text-rose-900">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 px-6 py-4 bg-slate-100 border-none rounded-2xl focus-ring text-sm"
                placeholder={t.add_need}
                value={newNeed}
                onChange={e => setNewNeed(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNeed()}
              />
              <button
                type="button"
                onClick={addNeed}
                className="px-6 bg-slate-900 text-white rounded-2xl font-black text-xs"
              >
                {t.add_btn}
              </button>
            </div>
          </section>

          {/* Action Row */}
          <div className="pt-4 space-y-4">
            <button onClick={handleSave} className="w-full bg-brand-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-brand-100 hover:bg-brand-700 transition-all">
              {t.save_changes}
            </button>

            <div className="border-t border-slate-100 pt-6">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600"
              >
                {showDebug ? t.hide_data : t.manage_db}
              </button>

              {showDebug && (
                <div className="mt-4 p-4 bg-slate-900 rounded-2xl space-y-3">
                  <pre className="text-white/40 text-[9px] font-mono break-all whitespace-pre-wrap">{JSON.stringify(user, null, 2)}</pre>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(user, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ecoshift-profile-${user.id}.json`;
                        a.click();
                      }}
                      className="flex-1 bg-white/10 text-white py-2 rounded-xl text-[10px] font-bold hover:bg-white/20"
                    >
                      {t.export_json}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t.confirm_reset)) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                      className="flex-1 bg-rose-500/20 text-rose-400 py-2 rounded-xl text-[10px] font-bold hover:bg-rose-500/40"
                    >
                      {t.reset_all}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
