import { User, Trip, CreditLog, Message, Notification, StudyGroup } from './types';

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

  /** Register new user and send verification email */
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

  /** Verify email with token from link */
  async verifyEmail(token: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || 'INVALID_TOKEN' };
    }
    this.triggerSyncUI();
    return { ok: true };
  }

  /** Resend verification email */
  async resendVerificationEmail(email: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText };
    }
    return { ok: true };
  }

  /** Request password reset email */
  async forgotPassword(email: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    await res.json().catch(() => ({}));
    return { ok: true };
  }

  /** Reset password with token from email */
  async resetPassword(token: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || 'INVALID_TOKEN' };
    }
    this.triggerSyncUI();
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
    await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trip)
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
    const res = await fetch(`${API_URL}/messages/${tripId}`);
    return res.json();
  }

  async sendMessage(message: Message): Promise<void> {
    await fetch(`${API_URL}/messages`, {
      method: 'POST', // Corrected endpoint from log to messages
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    this.triggerSyncUI();
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
    const res = await fetch(`${API_URL}/study-groups`);
    return res.json();
  }

  async createStudyGroup(group: StudyGroup): Promise<void> {
    await fetch(`${API_URL}/study-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group)
    });
    this.triggerSyncUI();
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
}

export const db = new MamaDB();
