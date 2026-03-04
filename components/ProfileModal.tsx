
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { User, UserRole, Review, TripsStats, CompletedTrip, DriverLicense } from '../types';
import { useLanguage } from '../i18n';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate?: (user: User) => void;
  isOwnProfile?: boolean;
  currentUserId?: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdate, isOwnProfile = true, currentUserId }) => {
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState<{ rating: number | null; totalReviews: number }>({ rating: null, totalReviews: 0 });
  const [showReviews, setShowReviews] = useState(false);
  
  // Trips History states
  const [tripsStats, setTripsStats] = useState<TripsStats>({ totalAsDriver: 0, totalAsPassenger: 0, totalCo2Saved: 0, totalDistanceKm: 0 });
  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [hasMoreTrips, setHasMoreTrips] = useState(false);
  const [tripsOffset, setTripsOffset] = useState(0);
  const [showTripsHistory, setShowTripsHistory] = useState(false);

  // Driver License states
  const [driverLicense, setDriverLicense] = useState<DriverLicense | null>(null);
  const [licenseForm, setLicenseForm] = useState({
    licenseNumber: '',
    issueDate: '',
    expiryDate: '',
    category: 'B',
    photoUrl: ''
  });
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name,
        role: user.role,
        skills: user.skills,
        accessibilityNeeds: user.accessibilityNeeds || [],
      });
      loadReviews();
      loadTripsStats();
      loadCompletedTrips(0, false);
      loadDriverLicense();
    }
  }, [isOpen, user]);

  const loadDriverLicense = async () => {
    try {
      const license = await db.getDriverLicense(user.id);
      setDriverLicense(license);
    } catch (err) {
      console.error('Error loading driver license:', err);
    }
  };

  const handleSaveLicense = async () => {
    setLicenseError(null);
    setLicenseLoading(true);
    
    if (!licenseForm.licenseNumber || !licenseForm.issueDate || !licenseForm.expiryDate || !licenseForm.photoUrl) {
      setLicenseError('Compila tutti i campi');
      setLicenseLoading(false);
      return;
    }

    try {
      const result = await db.saveDriverLicense({
        id: '',
        userId: user.id,
        licenseNumber: licenseForm.licenseNumber,
        issueDate: licenseForm.issueDate,
        expiryDate: licenseForm.expiryDate,
        category: licenseForm.category,
        photoUrl: licenseForm.photoUrl,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      if (result.success) {
        await loadDriverLicense();
      } else {
        setLicenseError(result.message || 'Errore nel salvataggio');
      }
    } catch (err) {
      setLicenseError('Errore nel salvataggio');
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleRemoveLicense = async () => {
    try {
      await db.deleteDriverLicense(user.id);
      setDriverLicense(null);
      setLicenseForm({
        licenseNumber: '',
        issueDate: '',
        expiryDate: '',
        category: 'B',
        photoUrl: ''
      });
    } catch (err) {
      console.error('Error removing license:', err);
    }
  };

  const loadReviews = async () => {
    try {
      const [userReviews, rating] = await Promise.all([
        db.getReviews(user.id),
        db.getUserRating(user.id)
      ]);
      setReviews(userReviews);
      setUserRating(rating);
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  const loadTripsStats = async () => {
    try {
      const stats = await db.getUserTripsStats(user.id);
      setTripsStats(stats);
    } catch (err) {
      console.error('Error loading trips stats:', err);
    }
  };

  const loadCompletedTrips = async (offset = 0, append = false) => {
    if (tripsLoading) return;
    setTripsLoading(true);
    try {
      const result = await db.getCompletedTrips(user.id, 20, offset);
      if (append) {
        setCompletedTrips(prev => [...prev, ...result.trips]);
      } else {
        setCompletedTrips(result.trips);
      }
      setHasMoreTrips(result.hasMore);
      setTripsOffset(offset);
    } catch (err) {
      console.error('Error loading completed trips:', err);
    } finally {
      setTripsLoading(false);
    }
  };

  const loadMoreTrips = () => {
    loadCompletedTrips(tripsOffset + 20, true);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = (rating % 1) >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <span key={i} className="text-amber-400">★</span>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <span key={i} className="text-amber-400" style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, width: '50%', overflow: 'hidden' }}>★</span>
            <span className="text-slate-300 dark:text-slate-600">★</span>
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-slate-300 dark:text-slate-600">★</span>
        );
      }
    }
    return stars;
  };

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
          {/* Header: Avatar and Stats - shown for all profiles */}
          <section className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={`https://picsum.photos/seed/${user.id}/128/128`}
                alt={user.name}
                className="w-20 h-20 rounded-2xl border-4 border-brand-500 shadow-lg"
              />
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.role === 'BOTH' ? t.role_flexible : user.role === 'DRIVER' ? t.role_driver_only : t.role_passenger_only}</p>
              </div>
            </div>

            {/* Stats Cards Grid 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 rounded-2xl p-4">
                <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
                  {tripsStats.totalAsDriver}
                </div>
                <div className="text-xs font-bold text-brand-700 dark:text-brand-300 mt-1">
                  {t.as_driver}
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {tripsStats.totalAsPassenger}
                </div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {t.as_passenger}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-2xl p-4">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {tripsStats.totalCo2Saved.toFixed(1)}
                </div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {t.co2_saved} (kg)
                </div>
              </div>

              <div className="bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 rounded-2xl p-4">
                <div className="text-2xl font-black text-violet-600 dark:text-violet-400">
                  {tripsStats.totalDistanceKm.toFixed(1)}
                </div>
                <div className="text-xs font-bold text-violet-700 dark:text-violet-300 mt-1">
                  {t.total_distance} ({t.km})
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
              <div className="text-3xl font-black text-slate-800 dark:text-white">
                {userRating.rating ? userRating.rating.toFixed(1) : '-'}
              </div>
              <div className="flex flex-col">
                <div className="flex">
                  {userRating.rating ? renderStars(userRating.rating) : (
                    <span className="text-slate-400 text-sm">Nessuna valutazione</span>
                  )}
                </div>
                <span className="text-xs text-slate-500">{userRating.totalReviews} {t.reviews || 'recensioni'}</span>
              </div>
            </div>

            {/* Reviews List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.reviews || 'Recensioni'}</h3>
                {reviews.length > 0 && (
                  <button
                    onClick={() => setShowReviews(!showReviews)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    {showReviews ? 'Nascondi' : 'Mostra'}
                  </button>
                )}
              </div>
              
              {showReviews && (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">{t.no_reviews_yet || 'Nessuna recensione ancora'}</p>
                  ) : (
                    reviews.slice(0, 5).map(review => (
                      <div key={review.id} className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">{renderStars(review.rating)}</div>
                            <span className="text-xs font-bold text-amber-500">({review.rating})</span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{review.reviewerName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{review.comment}"</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Driver License Section - shown for all users */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.driver_license}</h3>
            
            {/* License Status - for own profile */}
            {isOwnProfile && driverLicense && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300">{t.license_verified}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {driverLicense.licenseNumber} • {driverLicense.category}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveLicense}
                  className="text-xs text-rose-500 hover:text-rose-700 font-bold"
                >
                  {t.remove_license}
                </button>
              </div>
            )}

            {/* License Status - for other users */}
            {!isOwnProfile && driverLicense && driverLicense.status === 'verified' && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">{t.license_verified}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {driverLicense.category}
                  </p>
                </div>
              </div>
            )}

            {/* License Form - only for own profile */}
            {isOwnProfile && !driverLicense && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t.license_number}</label>
                    <input
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                      placeholder="AB1234567"
                      value={licenseForm.licenseNumber}
                      onChange={e => setLicenseForm({ ...licenseForm, licenseNumber: e.target.value.toUpperCase() })}
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t.license_category}</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                      value={licenseForm.category}
                      onChange={e => setLicenseForm({ ...licenseForm, category: e.target.value })}
                    >
                      <option value="B">B</option>
                      <option value="A">A</option>
                      <option value="A+B">A+B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t.license_issue_date}</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                      value={licenseForm.issueDate}
                      onChange={e => setLicenseForm({ ...licenseForm, issueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{t.license_expiry_date}</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                      value={licenseForm.expiryDate}
                      onChange={e => setLicenseForm({ ...licenseForm, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">{t.license_photo}</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Convert image to base64
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setLicenseForm({ ...licenseForm, photoUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {licenseForm.photoUrl && (
                    <div className="mt-2 relative">
                      <img src={licenseForm.photoUrl} alt="License" className="w-32 h-24 object-cover rounded-xl border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => setLicenseForm({ ...licenseForm, photoUrl: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full text-xs font-bold"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {licenseError && (
                  <p className="text-xs text-rose-500 font-bold">{licenseError}</p>
                )}

                <button
                  onClick={handleSaveLicense}
                  disabled={licenseLoading}
                  className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  {licenseLoading ? t.license_verifying : t.add_license}
                </button>
              </div>
            )}
          </section>

          {/* Edit Section - only shown for own profile */}
          {isOwnProfile && (
          <>
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

          {/* Reviews Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.reviews || 'Recensioni'}</h3>
              {reviews.length > 0 && (
                <button
                  onClick={() => setShowReviews(!showReviews)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  {showReviews ? 'Nascondi' : 'Mostra'}
                </button>
              )}
            </div>
            
            {/* Rating Stats */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
              <div className="text-3xl font-black text-slate-800 dark:text-white">
                {userRating.rating ? userRating.rating.toFixed(1) : '-'}
              </div>
              <div className="flex flex-col">
                <div className="flex">
                  {userRating.rating ? renderStars(userRating.rating) : (
                    <span className="text-slate-400 text-sm">Nessuna valutazione</span>
                  )}
                </div>
                <span className="text-xs text-slate-500">{userRating.totalReviews} {t.reviews || 'recensioni'}</span>
              </div>
            </div>

            {/* Reviews List */}
            {showReviews && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">{t.no_reviews_yet || 'Nessuna recensione ancora'}</p>
                ) : (
                  reviews.slice(0, 5).map(review => (
                    <div key={review.id} className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{review.reviewerName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{review.comment}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          {/* Trips History Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t.my_trips_history}</h3>
              {completedTrips.length > 0 && (
                <button
                  onClick={() => setShowTripsHistory(!showTripsHistory)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  {showTripsHistory ? 'Nascondi' : 'Mostra'}
                </button>
              )}
            </div>

            {/* Stats Cards Grid 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              {/* As Driver - Brand */}
              <div className="bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 rounded-2xl p-4">
                <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
                  {tripsStats.totalAsDriver}
                </div>
                <div className="text-xs font-bold text-brand-700 dark:text-brand-300 mt-1">
                  {t.as_driver}
                </div>
              </div>

              {/* As Passenger - Emerald */}
              <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {tripsStats.totalAsPassenger}
                </div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {t.as_passenger}
                </div>
              </div>

              {/* CO2 Saved - Amber */}
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-2xl p-4">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {tripsStats.totalCo2Saved.toFixed(1)}
                </div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {t.co2_saved} (kg)
                </div>
              </div>

              {/* Total Distance - Violet */}
              <div className="bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 rounded-2xl p-4">
                <div className="text-2xl font-black text-violet-600 dark:text-violet-400">
                  {tripsStats.totalDistanceKm.toFixed(1)}
                </div>
                <div className="text-xs font-bold text-violet-700 dark:text-violet-300 mt-1">
                  {t.total_distance} ({t.km})
                </div>
              </div>
            </div>

            {/* Completed Trips List */}
            {showTripsHistory && (
              <div className="space-y-2 max-h-80 overflow-y-auto animate-fade-in">
                {completedTrips.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">{t.no_completed_trips}</p>
                ) : (
                  completedTrips.map(trip => (
                    <div 
                      key={trip.id} 
                      className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <span>{new Date(trip.departureTime).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {trip.from} → {trip.to}
                        </div>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          trip.role === 'driver' 
                            ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300' 
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        }`}>
                          {trip.role === 'driver' ? t.as_driver : t.as_passenger}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Load More Button */}
                {hasMoreTrips && (
                  <button
                    onClick={loadMoreTrips}
                    disabled={tripsLoading}
                    className="w-full py-3 text-sm font-bold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                  >
                    {tripsLoading ? t.loading : t.load_more}
                  </button>
                )}
              </div>
            )}
          </section>
          </>
          )}

          {/* Action Row - only for own profile */}
          {isOwnProfile && (
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
          )}
        </div>
      </div>
    </div>
  );
};
