import { User, Trip, CreditLog, Message, Notification, StudyGroup, Review, UserRating, TripsStats, CompletedTrip, CompletedTripsResponse } from './types';
import { normalizeLocation } from './constants';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

/**
 * MamaDB - Client-side wrapper for EcoShift API.
 * Now communicates with the Express backend using Fetch API.
 */
class MamaDB {

  // Helper for triggering UI sync (still useful for some local reactivity if needed, 
  // but React state management should largely replace this)
  private triggerSyncUI() {
    window.dispatchEvent(new CustomEvent('ecoshift-sync', { detail: { timestamp: new Date() } }));
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/users?t=${Date.now()}`);
    return res.json();
  }

  async saveUser(user: User): Promise<void> {
    await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    this.triggerSyncUI();
  }

  async register(user: User): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    return { ok: true };
  }

  async sendOTP(email: string, name: string, role: string, password: string): Promise<{ ok: boolean; error?: string; mock?: boolean; devCode?: string; emailError?: any }> {
    const res = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    return { ok: true, mock: data.mock, devCode: data.devCode, emailError: data.emailError };
  }

  async verifyOTP(email: string, code: string): Promise<{ ok: boolean; error?: string; user?: User }> {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    return { ok: true, user: data.user };
  }

  async resendOTP(email: string): Promise<{ ok: boolean; error?: string; mock?: boolean }> {
    const res = await fetch(`${API_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    return { ok: true, mock: data.mock };
  }

  async forgotPassword(email: string): Promise<{ ok: boolean; error?: string; mock?: boolean; devCode?: string }> {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    return { ok: true, mock: data.mock, devCode: data.devCode };
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    return { ok: true };
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const users = await this.getUsers();
    const existing = users.find(u => u.id === userId);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    await this.saveUser(updated);
    return updated;
  }

  async updateUserCredits(userId: string, additionalCredits: number): Promise<User | null> {
    const res = await fetch(`${API_URL}/users/${userId}/credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: additionalCredits })
    });
    if (!res.ok) return null;
    const updatedUser = await res.json();
    this.triggerSyncUI();
    return updatedUser;
  }

  async updateUserTheme(userId: string, theme: 'light' | 'dark'): Promise<User | null> {
    const res = await fetch(`${API_URL}/users/${userId}/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme })
    });
    if (!res.ok) return null;
    const updatedUser = await res.json();
    this.triggerSyncUI();
    return updatedUser;
  }

  // --- Session ---
  // Session is still local for now to keep it simple, or we could verify with backend.
  // Keeping it local for "login" state persistence across refresh.
  getCurrentSession(): User | null {
    const data = localStorage.getItem('ecoshift_session_user');
    return data ? JSON.parse(data) : null;
  }

  setSession(user: User | null) {
    if (user) {
      localStorage.setItem('ecoshift_session_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ecoshift_session_user');
    }
  }

  // --- Trips ---
  async getTrips(): Promise<Trip[]> {
    const res = await fetch(`${API_URL}/trips`);
    return res.json();
  }

  async saveTrip(trip: Trip): Promise<void> {
    // Normalizza i nomi delle stazioni prima di salvare
    const normalizedTrip = {
      ...trip,
      from: normalizeLocation(trip.from),
      to: normalizeLocation(trip.to)
    };
    
    await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedTrip)
    });
    this.triggerSyncUI();
  }

  async deleteTrip(tripId: string): Promise<void> {
    await fetch(`${API_URL}/trips/${tripId}`, { method: 'DELETE' });
    this.triggerSyncUI();
  }

  async updateTrip(tripId: string, updates: Partial<Trip>): Promise<Trip | null> {
    // For simplicity, we fetch, merge, and save. 
    // Ideally backend handles PATCH.
    const trips = await this.getTrips();
    const existing = trips.find(t => t.id === tripId);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    await this.saveTrip(updated);
    return updated;
  }

  // --- Credit Logs ---
  async getCreditLogs(userId: string): Promise<CreditLog[]> {
    const res = await fetch(`${API_URL}/credit-logs/${userId}`);
    return res.json();
  }

  async addCreditLog(log: CreditLog): Promise<void> {
    await fetch(`${API_URL}/credit-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    this.triggerSyncUI();
  }

  // --- AI Cache ---
  // Keeping this local for performance/simplicity or move to DB?
  // Let's keep it local for now as it's cache.
  getAICache(userId: string, tripId: string): string | null {
    return localStorage.getItem(`ecoshift_ai_cache_${userId}_${tripId}`);
  }

  saveAICache(userId: string, tripId: string, reason: string) {
    localStorage.setItem(`ecoshift_ai_cache_${userId}_${tripId}`, reason);
  }

  // --- Utility ---
  async resetAllData() {
    // Not implemented for server side safely
    console.warn("Reset not fully implemented for server");
  }

  async exportAllData(): Promise<string> {
    const [users, trips] = await Promise.all([this.getUsers(), this.getTrips()]);
    return JSON.stringify({ users, trips }, null, 2);
  }

  // --- Chat ---
  async getMessages(tripId: string): Promise<Message[]> {
    try {
      const res = await fetch(`${API_URL}/messages/${tripId}`);
      if (!res.ok) {
        console.error('Failed to fetch messages:', res.status, res.statusText);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error fetching messages:', err);
      return [];
    }
  }

  async sendMessage(message: Message): Promise<void> {
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error.error || 'Failed to send message');
      }
      this.triggerSyncUI();
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }

  async uploadFile(file: File): Promise<string> {
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/jpeg;base64, prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `chat-${timestamp}-${random}.${extension}`;

      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64,
          fileName,
          contentType: file.type
        })
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error.error || 'Failed to upload file');
      }

      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    }
  }

  // --- Notifications ---
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const res = await fetch(`${API_URL}/notifications?userId=${userId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('getNotifications error:', err);
      return [];
    }
  }

  async addNotification(notification: Notification): Promise<void> {
    await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    });
    this.triggerSyncUI();
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await fetch(`${API_URL}/notifications/${notificationId}/read`, { method: 'PUT' });
    this.triggerSyncUI();
  }

  // --- Study Groups ---
  async getStudyGroups(): Promise<StudyGroup[]> {
    try {
      const res = await fetch(`${API_URL}/study-groups`);
      if (!res.ok) {
        console.error('Failed to fetch study groups:', res.status, res.statusText);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error fetching study groups:', err);
      return [];
    }
  }

  async createStudyGroup(group: StudyGroup): Promise<void> {
    try {
      const res = await fetch(`${API_URL}/study-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(group)
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error.error || 'Failed to create study group');
      }
      this.triggerSyncUI();
    } catch (err) {
      console.error('Error creating study group:', err);
      throw err;
    }
  }

  async joinStudyGroup(groupId: string, userId: string): Promise<void> {
    const res = await fetch(`${API_URL}/study-groups/${groupId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error('Failed to join');
    this.triggerSyncUI();
  }

  async deleteStudyGroup(groupId: string): Promise<void> {
    await fetch(`${API_URL}/study-groups/${groupId}`, { method: 'DELETE' });
    this.triggerSyncUI();
  }

async getRealTimeDepartures(stationId: string, time?: Date): Promise<any[]> {
    // stationId example: S01700 (Milano Centrale), S00248 (Milano Bovisa)
    let url = `${API_URL}/trains/departures/${stationId}`;
    if (time) {
      url += `?time=${time.toISOString()}`;
    }
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  }

  // --- Reviews ---
  async createReview(review: Review): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error || res.statusText };
      }
      this.triggerSyncUI();
      return { ok: true };
    } catch (err) {
      console.error('Error creating review:', err);
      return { ok: false, error: err.message };
    }
  }

  async getReviews(userId: string): Promise<Review[]> {
    try {
      const res = await fetch(`${API_URL}/reviews/${userId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error fetching reviews:', err);
      return [];
    }
  }

  async getUserRating(userId: string): Promise<UserRating> {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/rating`);
      if (!res.ok) return { rating: null, totalReviews: 0 };
      const data = await res.json();
      return {
        rating: data.rating,
        totalReviews: data.totalReviews || 0
      };
    } catch (err) {
      console.error('Error fetching user rating:', err);
      return { rating: null, totalReviews: 0 };
    }
  }

  async getUserTripsStats(userId: string): Promise<TripsStats> {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/trips-stats?includeFuture=true`);
      if (!res.ok) return { totalAsDriver: 0, totalAsPassenger: 0, totalCo2Saved: 0, totalDistanceKm: 0 };
      const data = await res.json();
      return {
        totalAsDriver: data.totalAsDriver || 0,
        totalAsPassenger: data.totalAsPassenger || 0,
        totalCo2Saved: data.totalCo2Saved || 0,
        totalDistanceKm: data.totalDistanceKm || 0
      };
    } catch (err) {
      console.error('Error fetching user trips stats:', err);
      return { totalAsDriver: 0, totalAsPassenger: 0, totalCo2Saved: 0, totalDistanceKm: 0 };
    }
  }

  async getCompletedTrips(userId: string, limit = 20, offset = 0): Promise<CompletedTripsResponse> {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/completed-trips?limit=${limit}&offset=${offset}&includeFuture=true`);
      if (!res.ok) return { trips: [], total: 0, hasMore: false };
      const data = await res.json();
      return {
        trips: data.trips || [],
        total: data.total || 0,
        hasMore: data.hasMore || false
      };
    } catch (err) {
      console.error('Error fetching completed trips:', err);
      return { trips: [], total: 0, hasMore: false };
    }
  }
}

export const db = new MamaDB();
