
import React, { useState, useEffect } from 'react';
import { Trip, User, Review } from '../types';
import { db } from '../db';
import { useLanguage } from '../i18n';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  currentUser: User;
  onReviewSubmitted: () => void;
  historyId?: string | null;
}

interface Participant {
  id: string;
  name: string;
  rating?: number | null;
  totalReviews?: number;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  trip,
  currentUser,
  onReviewSubmitted,
  historyId
}) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [existingReview, setExistingReview] = useState(false);

  const isDriver = trip?.driverId === currentUser.id;

  useEffect(() => {
    if (isOpen && trip) {
      setRating(0);
      setHoverRating(0);
      setComment('');
      setError(null);
      setIsSubmitting(false);
      setParticipant(null);
      setExistingReview(false);
      loadParticipant();
    }
  }, [isOpen, trip?.id, currentUser.id]);

  const loadParticipant = async () => {
    if (!trip) return;
    try {
      const users = await db.getUsers();
      
      if (isDriver) {
        // Driver reviews a passenger
        const passengers = (trip.passengerIds || []).filter(id => id !== currentUser.id);
        if (passengers.length > 0) {
          const passenger = users.find(u => u.id === passengers[0]);
          if (passenger) {
            setParticipant({ id: passenger.id, name: passenger.name, rating: (passenger as any).rating, totalReviews: (passenger as any).totalReviews });
          }
        }
      } else {
        // Passenger reviews the driver
        const driver = users.find(u => u.id === trip.driverId);
        if (driver) {
          setParticipant({ id: driver.id, name: driver.name, rating: (driver as any).rating, totalReviews: (driver as any).totalReviews });
        }
      }

      // Check if already reviewed
      const reviews = await db.getReviews(currentUser.id);
      const alreadyReviewed = reviews.some(r => r.tripId === trip.id);
      setExistingReview(alreadyReviewed);
    } catch (err) {
      console.error('Error loading participant:', err);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError(t.rating_required || 'Please select a rating');
      return;
    }

    if (comment.length > 0 && comment.length < 5) {
      setError(t.comment_too_short || 'Comment must be at least 5 characters');
      return;
    }

    if (!participant) {
      setError('No participant to review');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const review: Review = {
      id: Date.now().toString(),
      tripId: trip.id,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      reviewedId: participant.id,
      reviewedName: participant.name,
      type: isDriver ? 'driver_to_passenger' : 'passenger_to_driver',
      rating,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const result = await db.createReview(review);

    if (result.ok) {
      // Mark review as submitted in history if we have a historyId
      if (historyId) {
        await db.markReviewSubmitted(historyId);
      }
      onReviewSubmitted();
      onClose();
    } else {
      if (result.error === 'ALREADY_REVIEWED') {
        setError(t.already_reviewed || 'You have already reviewed this trip');
      } else if (result.error === 'NOT_PARTICIPANT') {
        setError(t.not_participant || 'You were not a participant in this trip');
      } else {
        setError(result.error || 'Failed to submit review');
      }
    }

    setIsSubmitting(false);
  };

  if (!isOpen || !trip) return null;

  const getRatingText = () => {
    const r = hoverRating || rating;
    if (r === 0) return '';
    const texts = ['', 'Pessimo', 'Scarso', 'Accettabile', 'Buono', 'Eccellente'];
    return texts[r] || '';
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-brand-500 to-emerald-500 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black">{t.leave_review || 'Lascia una recensione'}</h2>
              <p className="text-white/70 text-xs font-medium mt-1">
                {isDriver 
                  ? (t.review_passenger || 'Recensisci il passeggero')
                  : (t.review_driver || 'Recensisci il driver')}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center text-xl">✕</button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {existingReview ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-slate-600 font-bold">{t.already_reviewed || 'Hai già lasciato una recensione per questo viaggio'}</p>
            </div>
          ) : (
            <>
              {/* Trip Info */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.trip || 'Viaggio'}</p>
                <p className="font-bold text-slate-800 dark:text-white">
                  {trip.from} → {trip.to}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(trip.departureTime).toLocaleDateString()}
                </p>
              </div>

              {/* Participant to Review */}
              {participant && (
                <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <img
                    src={`https://picsum.photos/seed/${participant.id}/64/64`}
                    alt={participant.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 dark:text-white">{participant.name}</p>
                    {participant.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-amber-400">★</span>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {participant.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({participant.totalReviews} {t.reviews || 'recensioni'})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Star Rating */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {t.your_rating || 'La tua valutazione'}
                </p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      <span
                        className={star <= (hoverRating || rating) 
                          ? 'text-amber-400 drop-shadow-sm' 
                          : 'text-slate-300 dark:text-slate-600'}
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                {getRatingText() && (
                  <p className="text-center mt-2 text-sm font-medium text-amber-500">
                    {getRatingText()}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {t.comment_optional || 'Commento (opzionale)'}
                </p>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all resize-none"
                  rows={3}
                  placeholder={t.write_comment || 'Condividi la tua esperienza...'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{comment.length}/500</p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
                  <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t.submitting || 'Invio...'}
                  </span>
                ) : (
                  t.submit_review || 'Invia recensione'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
