const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./database');
const { isPostgres } = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

const BREVO_API_KEY = process.env.BREVO_API_KEY;

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, code, userName) {
    if (!BREVO_API_KEY) {
        console.log('[OTP] BREVO_API_KEY not set. Code:', code, 'for:', email);
        return { success: true, mock: true, code };
    }
    
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'api-key': BREVO_API_KEY
            },
            body: JSON.stringify({
                sender: { name: 'EcoShift', email: 'aivideos.tiktok06@gmail.com' },
                to: [{ email: email, name: userName || 'Utente' }],
                subject: 'Verifica la tua email - EcoShift',
                htmlContent: `
                    <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 16px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">EcoShift</h1>
                            <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Verifica la tua email</p>
                        </div>
                        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="color: #475569; font-size: 16px;">Ciao ${userName || 'utente'},</p>
                            <p style="color: #64748b; font-size: 14px;">Inserisci questo codice per completare la registrazione:</p>
                            <div style="background: white; padding: 20px 40px; border-radius: 12px; display: inline-block; margin: 20px 0; border: 2px solid #e2e8f0;">
                                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #059669;">${code}</span>
                            </div>
                            <p style="color: #94a3b8; font-size: 12px;">Il codice scade tra 10 minuti.</p>
                        </div>
                    </body>
                    </html>
                `
            })
        });
        
        const data = await response.json();
        if (!response.ok) {
            console.error('[OTP] Brevo API error:', JSON.stringify(data));
            return { success: false, error: data, code };
        }
        console.log('[OTP] Email sent successfully via Brevo:', data.messageId);
        return { success: true, id: data.messageId };
    } catch (err) {
        console.error('[OTP] Fetch error:', err.message);
        return { success: false, error: { message: err.message }, code };
    }
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Auth: Send OTP for registration ---
app.post('/api/auth/send-otp', async (req, res) => {
    const { email, name, role, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    
    if (!normalizedEmail || !name || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        const existing = await db.query('SELECT id FROM users WHERE id = ?', [normalizedEmail]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'EMAIL_EXISTS' });
        }
        
        const code = generateOTP();
        const id = crypto.randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
        
        const insertSql = isPostgres
            ? `INSERT INTO email_verifications (id, email, code, "userData", "createdAt", "expiresAt") VALUES (?, ?, ?, ?, ?, ?)`
            : `INSERT INTO email_verifications (id, email, code, userData, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?)`;
        
        await db.query(insertSql, [id, normalizedEmail, code, JSON.stringify({ name, role: role || 'BOTH', password }), now.toISOString(), expiresAt.toISOString()]);
        
        const emailResult = await sendOTPEmail(normalizedEmail, code, name);
        
        // In sviluppo o se Resend ha limitazioni, ritorna comunque il codice per test
        const isDev = process.env.NODE_ENV !== 'production';
        
        res.json({ 
            message: 'OTP sent successfully', 
            email: normalizedEmail,
            expiresIn: 600,
            mock: emailResult.mock || !emailResult.success,
            devCode: (isDev || !emailResult.success) ? code : undefined,
            emailError: !emailResult.success ? emailResult.error : undefined
        });
    } catch (err) {
        console.error('[OTP] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Auth: Verify OTP ---
app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, code } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    
    if (!normalizedEmail || !code) {
        return res.status(400).json({ error: 'Missing email or code' });
    }
    
    try {
        const sql = isPostgres
            ? 'SELECT id, email, code, "userData" as "userData", "createdAt" as "createdAt", "expiresAt" as "expiresAt", verified FROM email_verifications WHERE email = ? AND code = ? AND verified = 0 ORDER BY "createdAt" DESC LIMIT 1'
            : 'SELECT * FROM email_verifications WHERE email = ? AND code = ? AND verified = 0 ORDER BY createdAt DESC LIMIT 1';
        
        const rows = await db.query(sql, [normalizedEmail, code]);
        
        if (rows.length === 0) {
            return res.status(400).json({ error: 'INVALID_CODE' });
        }
        
        const verification = rows[0];
        const now = new Date();
        const expiresAt = new Date(verification.expiresAt);
        
        if (now > expiresAt) {
            return res.status(400).json({ error: 'CODE_EXPIRED' });
        }
        
        const userData = JSON.parse(verification.userData);
        
        const insertSql = isPostgres
            ? `INSERT INTO users (id, name, role, skills, "accessibilityNeeds", credits, password) VALUES (?, ?, ?, ?, ?, ?, ?)`
            : `INSERT INTO users (id, name, role, skills, accessibilityNeeds, credits, password) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        await db.query(insertSql, [
            normalizedEmail,
            userData.name,
            userData.role,
            JSON.stringify([]),
            JSON.stringify([]),
            500,
            userData.password
        ]);
        
        await db.query('UPDATE email_verifications SET verified = 1 WHERE id = ?', [verification.id]);
        
        res.json({ 
            message: 'Email verified successfully', 
            user: { 
                id: normalizedEmail, 
                name: userData.name, 
                role: userData.role,
                credits: 500
            } 
        });
    } catch (err) {
        console.error('[OTP] Verify error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Auth: Resend OTP ---
app.post('/api/auth/resend-otp', async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    
    if (!normalizedEmail) {
        return res.status(400).json({ error: 'Missing email' });
    }
    
    try {
        const sql = isPostgres
            ? 'SELECT id, email, code, "userData" as "userData", "createdAt" as "createdAt", "expiresAt" as "expiresAt", verified FROM email_verifications WHERE email = ? AND verified = 0 ORDER BY "createdAt" DESC LIMIT 1'
            : 'SELECT * FROM email_verifications WHERE email = ? AND verified = 0 ORDER BY createdAt DESC LIMIT 1';
        
        const rows = await db.query(sql, [normalizedEmail]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'NO_PENDING_VERIFICATION' });
        }
        
        const verification = rows[0];
        const userData = JSON.parse(verification.userData || verification.userdata);
        const code = generateOTP();
        const id = crypto.randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
        
        const insertSql = isPostgres
            ? `INSERT INTO email_verifications (id, email, code, "userData", "createdAt", "expiresAt") VALUES (?, ?, ?, ?, ?, ?)`
            : `INSERT INTO email_verifications (id, email, code, userData, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?)`;
        
        await db.query(insertSql, [id, normalizedEmail, code, JSON.stringify(userData), now.toISOString(), expiresAt.toISOString()]);
        
        const emailResult = await sendOTPEmail(normalizedEmail, code, userData.name);
        
        res.json({ 
            message: 'OTP resent successfully',
            expiresIn: 600,
            mock: emailResult.mock
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Auth: Forgot Password - Send OTP ---
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    
    if (!normalizedEmail) {
        return res.status(400).json({ error: 'Missing email' });
    }
    
    try {
        const existing = await db.query('SELECT id, name FROM users WHERE id = ?', [normalizedEmail]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'EMAIL_NOT_FOUND' });
        }
        
        const user = existing[0];
        const code = generateOTP();
        const id = crypto.randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
        
        const insertSql = isPostgres
            ? `INSERT INTO password_resets (id, email, code, "createdAt", "expiresAt") VALUES (?, ?, ?, ?, ?)`
            : `INSERT INTO password_resets (id, email, code, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?)`;
        
        await db.query(insertSql, [id, normalizedEmail, code, now.toISOString(), expiresAt.toISOString()]);
        
        const emailResult = await sendPasswordResetEmail(normalizedEmail, code, user.name);
        
        res.json({ 
            message: 'Reset code sent successfully', 
            email: normalizedEmail,
            expiresIn: 600,
            mock: emailResult.mock,
            devCode: emailResult.code
        });
    } catch (err) {
        console.error('[Forgot Password] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Auth: Reset Password - Verify OTP and Update Password ---
app.post('/api/auth/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    
    if (!normalizedEmail || !code || !newPassword) {
        return res.status(400).json({ error: 'Missing email, code or newPassword' });
    }
    
    try {
        const sql = isPostgres
            ? 'SELECT * FROM password_resets WHERE email = ? AND code = ? AND used = 0 ORDER BY "createdAt" DESC LIMIT 1'
            : 'SELECT * FROM password_resets WHERE email = ? AND code = ? AND used = 0 ORDER BY createdAt DESC LIMIT 1';
        
        const rows = await db.query(sql, [normalizedEmail, code]);
        
        if (rows.length === 0) {
            return res.status(400).json({ error: 'INVALID_CODE' });
        }
        
        const reset = rows[0];
        const now = new Date();
        const expiresAt = new Date(reset.expiresAt || reset.expiresat);
        
        if (now > expiresAt) {
            return res.status(400).json({ error: 'CODE_EXPIRED' });
        }
        
        const updateSql = isPostgres
            ? `UPDATE users SET password = ? WHERE id = ?`
            : `UPDATE users SET password = ? WHERE id = ?`;
        
        await db.query(updateSql, [newPassword, normalizedEmail]);
        
        await db.query('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]);
        
        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('[Reset Password] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

async function sendPasswordResetEmail(email, code, userName) {
    if (!BREVO_API_KEY) {
        console.log('[Password Reset] BREVO_API_KEY not set. Code:', code, 'for:', email);
        return { success: true, mock: true, code };
    }
    
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'api-key': BREVO_API_KEY
            },
            body: JSON.stringify({
                sender: { name: 'EcoShift', email: 'aivideos.tiktok06@gmail.com' },
                to: [{ email: email, name: userName || 'Utente' }],
                subject: 'Reimposta la tua password - EcoShift',
                htmlContent: `
                    <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #dc2626 0%, #f87171 100%); padding: 30px; border-radius: 16px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">EcoShift</h1>
                            <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Reimposta la tua password</p>
                        </div>
                        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="color: #475569; font-size: 16px;">Ciao ${userName || 'utente'},</p>
                            <p style="color: #64748b; font-size: 14px;">Hai richiesto di reimpostare la tua password. Inserisci questo codice:</p>
                            <div style="background: white; padding: 20px 40px; border-radius: 12px; display: inline-block; margin: 20px 0; border: 2px solid #e2e8f0;">
                                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #dc2626;">${code}</span>
                            </div>
                            <p style="color: #94a3b8; font-size: 12px;">Il codice scade tra 10 minuti. Se non hai richiesto questo reset, ignora questa email.</p>
                        </div>
                    </body>
                    </html>
                `
            })
        });
        
        const data = await response.json();
        if (!response.ok) {
            console.error('[Password Reset] Brevo API error:', JSON.stringify(data));
            return { success: false, error: data, code };
        }
        console.log('[Password Reset] Email sent successfully via Brevo:', data.messageId);
        return { success: true, id: data.messageId };
    } catch (err) {
        console.error('[Password Reset] Fetch error:', err.message);
        return { success: false, error: { message: err.message }, code };
    }
}

app.post('/api/auth/register', async (req, res) => {
    const user = req.body;
    const normalizedId = (user.id || '').toLowerCase().trim();
    if (!normalizedId || !user.name || !user.password) {
        return res.status(400).json({ error: 'Missing id, name or password' });
    }
    try {
        const existing = await db.query('SELECT id FROM users WHERE id = ?', [normalizedId]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'EMAIL_EXISTS' });
        }
        const params = [
            normalizedId,
            user.name,
            user.role || 'BOTH',
            JSON.stringify(user.skills || []),
            JSON.stringify(user.accessibilityNeeds || []),
            user.credits != null ? user.credits : 500,
            user.password
        ];
        const sql = isPostgres
            ? `INSERT INTO users (id, name, role, skills, "accessibilityNeeds", credits, password) VALUES (?, ?, ?, ?, ?, ?, ?)`
            : `INSERT INTO users (id, name, role, skills, accessibilityNeeds, credits, password) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await db.query(sql, params);

        res.json({ message: 'User registered', id: normalizedId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Users ---
app.get('/api/users', async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM users');
        const users = rows.map(u => ({
            ...u,
            skills: JSON.parse(u.skills || '[]'),
            accessibilityNeeds: JSON.parse(u.accessibilityNeeds || '[]')
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    const user = req.body;
    const params = [
        user.id,
        user.name,
        user.role,
        JSON.stringify(user.skills || []),
        JSON.stringify(user.accessibilityNeeds || []),
        user.credits,
        user.password
    ];
    const sql = isPostgres
        ? `INSERT INTO users (id, name, role, skills, "accessibilityNeeds", credits, password) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, skills = EXCLUDED.skills,
           "accessibilityNeeds" = EXCLUDED."accessibilityNeeds", credits = EXCLUDED.credits, password = EXCLUDED.password`
        : `INSERT OR REPLACE INTO users (id, name, role, skills, accessibilityNeeds, credits, password) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    try {
        await db.query(sql, params);
        res.json({ message: 'User saved', id: user.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/:id/credits', async (req, res) => {
    const { amount } = req.body;
    const sql = `UPDATE users SET credits = credits + ? WHERE id = ?`;

    try {
        await db.query(sql, [amount, req.params.id]);
        const rows = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        const row = rows[0];
        if (row) {
            row.skills = JSON.parse(row.skills || '[]');
            row.accessibilityNeeds = JSON.parse(row.accessibilityNeeds || '[]');
        }
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint per aggiornare il tema preferito dell'utente
app.put('/api/users/:id/theme', async (req, res) => {
    const { theme } = req.body;
    const sql = `UPDATE users SET theme = ? WHERE id = ?`;

    try {
        await db.query(sql, [theme, req.params.id]);
        const rows = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        const row = rows[0];
        if (row) {
            row.skills = JSON.parse(row.skills || '[]');
            row.accessibilityNeeds = JSON.parse(row.accessibilityNeeds || '[]');
        }
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Trips ---
app.get('/api/trips', async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM trips');
        const trips = rows.map(t => ({
            ...t,
            from: t.fromLoc,
            to: t.toLoc,
            specialEquipment: JSON.parse(t.specialEquipment || '[]'),
            passengerIds: JSON.parse(t.passengerIds || '[]'),
            assistanceOffered: !!t.assistanceOffered
        }));
        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/trips', async (req, res) => {
    const trip = req.body;
    const params = [
        trip.id,
        trip.driverId,
        trip.driverName,
        trip.from,
        trip.to,
        trip.departureTime,
        trip.seatsAvailable,
        trip.distanceKm,
        trip.co2Saved,
        trip.tutoringSubject,
        trip.assistanceOffered ? 1 : 0,
        JSON.stringify(trip.specialEquipment || []),
        JSON.stringify(trip.passengerIds || [])
    ];
    const sql = isPostgres
        ? `INSERT INTO trips (id, "driverId", "driverName", "fromLoc", "toLoc", "departureTime", "seatsAvailable", "distanceKm", "co2Saved", "tutoringSubject", "assistanceOffered", "specialEquipment", "passengerIds")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET "driverId" = EXCLUDED."driverId", "driverName" = EXCLUDED."driverName", "fromLoc" = EXCLUDED."fromLoc", "toLoc" = EXCLUDED."toLoc",
           "departureTime" = EXCLUDED."departureTime", "seatsAvailable" = EXCLUDED."seatsAvailable", "distanceKm" = EXCLUDED."distanceKm", "co2Saved" = EXCLUDED."co2Saved",
           "tutoringSubject" = EXCLUDED."tutoringSubject", "assistanceOffered" = EXCLUDED."assistanceOffered", "specialEquipment" = EXCLUDED."specialEquipment", "passengerIds" = EXCLUDED."passengerIds"`
        : `INSERT OR REPLACE INTO trips (id, driverId, driverName, fromLoc, toLoc, departureTime, seatsAvailable, distanceKm, co2Saved, tutoringSubject, assistanceOffered, specialEquipment, passengerIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        await db.query(sql, params);
        res.json({ message: 'Trip saved', id: trip.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/trips/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM trips WHERE id = ?', [req.params.id]);
        res.json({ message: 'Trip deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Notifications ---
app.get('/api/notifications', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.json([]);

    try {
        const sql = isPostgres
            ? 'SELECT * FROM notifications WHERE "userId" = ? ORDER BY timestamp DESC'
            : 'SELECT * FROM notifications WHERE userId = ? ORDER BY timestamp DESC';

        const rows = await db.query(sql, [userId]);
        const notifs = rows.map(n => ({
            ...n,
            read: !!(n.read ?? n.READ ?? 0)
        }));
        res.json(notifs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/notifications', async (req, res) => {
    const n = req.body;
    console.log('[API] Creating notification:', { userId: n.userId, type: n.type, text: n.text?.substring(0, 50) });

    if (!n.id || !n.userId || !n.text) {
        console.error('[API] Missing required notification fields:', { id: !!n.id, userId: !!n.userId, text: !!n.text });
        return res.status(400).json({ error: 'Missing required fields: id, userId, text' });
    }

    const sql = isPostgres
        ? `INSERT INTO notifications (id, "userId", text, read, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)`
        : `INSERT INTO notifications (id, userId, text, read, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)`;
    try {
        await db.query(sql, [n.id, n.userId, n.text, n.read ? 1 : 0, n.type, n.timestamp]);
        console.log('[API] Notification created successfully:', n.id);
        res.json({ message: 'Notification added', id: n.id });
    } catch (err) {
        console.error('[API] Error creating notification:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        await db.query('UPDATE notifications SET read = 1 WHERE id = ?', [req.params.id]);
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Chat Messages ---
app.get('/api/messages/:tripId', async (req, res) => {
    try {
        const sql = isPostgres
            ? 'SELECT * FROM messages WHERE "tripId" = ? ORDER BY timestamp ASC'
            : 'SELECT * FROM messages WHERE tripId = ? ORDER BY timestamp ASC';
        const rows = await db.query(sql, [req.params.tripId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/messages', async (req, res) => {
    const m = req.body;
    console.log('[API] Creating message:', { tripId: m.tripId, senderId: m.senderId, text: m.text?.substring(0, 30) });

    if (!m.id || !m.tripId || !m.senderId || !m.text) {
        console.error('[API] Missing required message fields');
        return res.status(400).json({ error: 'Missing required fields: id, tripId, senderId, text' });
    }

    const sql = isPostgres
        ? `INSERT INTO messages (id, "tripId", "senderId", "senderName", text, timestamp, "attachmentUrl", "attachmentType") VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        : `INSERT INTO messages (id, tripId, senderId, senderName, text, timestamp, attachmentUrl, attachmentType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
        await db.query(sql, [m.id, m.tripId, m.senderId, m.senderName, m.text, m.timestamp, m.attachmentUrl || null, m.attachmentType || null]);
        console.log('[API] Message created successfully:', m.id);
        res.json({ message: 'Message sent', id: m.id });
    } catch (err) {
        console.error('[API] Error creating message:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- Credit Logs ---
app.get('/api/credit-logs/:userId', async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM credit_logs WHERE userId = ? ORDER BY timestamp DESC', [req.params.userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/credit-logs', async (req, res) => {
    const l = req.body;
    const sql = `INSERT INTO credit_logs (id, userId, amount, reason, timestamp) VALUES (?, ?, ?, ?, ?)`;
    try {
        await db.query(sql, [l.id, l.userId, l.amount, l.reason, l.timestamp]);
        res.json({ message: 'Log added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- File Upload ---
app.post('/api/upload', async (req, res) => {
    const { file, fileName, contentType } = req.body;
    
    if (!file || !fileName) {
        return res.status(400).json({ error: 'Missing file or fileName' });
    }

    try {
        const id = Date.now().toString();
        const createdAt = new Date().toISOString();
        
        // Salva nel database come base64 (come tutti gli altri dati)
        const sql = `INSERT INTO attachments (id, messageId, fileName, contentType, data, createdAt) VALUES (?, ?, ?, ?, ?, ?)`;
        await db.query(sql, [id, null, fileName, contentType || 'image/jpeg', file, createdAt]);
        
        // Costruisci URL per recuperare l'immagine (URL relativo per funzionare sia in locale che su Vercel)
        const imageUrl = `/api/attachments/${id}`;
        
        console.log('[API] File saved to database:', id);
        res.json({ url: imageUrl, id: id });
    } catch (err) {
        console.error('[API] Error uploading file:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- Get Attachment from Database ---
app.get('/api/attachments/:id', async (req, res) => {
    try {
        const sql = 'SELECT * FROM attachments WHERE id = ?';
        const rows = await db.query(sql, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Attachment not found' });
        }
        
        const attachment = rows[0];
        
        // Decodifica base64 e invia come immagine
        const imageBuffer = Buffer.from(attachment.data, 'base64');
        
        res.set('Content-Type', attachment.contentType);
        res.set('Cache-Control', 'public, max-age=31536000');
        res.send(imageBuffer);
    } catch (err) {
        console.error('[API] Error retrieving attachment:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- Train Study Groups ---

// Proxy for Real-Time Train Data (ViaggiaTreno)
app.get('/api/trains/departures/:stationId', async (req, res) => {
    const stationId = req.params.stationId;
    // Accept time as query param (timestamp in ms or ISO)
    let timestamp = Date.now();
    if (req.query.time) {
        // If it's a date string, convert to ms
        const parsed = new Date(req.query.time).getTime();
        if (!isNaN(parsed)) timestamp = parsed;
    }

    // Using the SoluzioniViaggioNew/Partenze endpoint pattern which appears to accept a timestamp for the starting view
    // Format: http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/partenze/{stationId}/{timestamp_string}
    // The API is known to accept standard date strings format roughly like "Wed Feb 01 2023 10:00:00 GMT+0100"
    // Let's formatting it to standard English date string which JS toString() often provides close enough, 
    // or specifically format it if needed.
    const dateObj = new Date(timestamp);
    // ViaggiaTreno expects: Mon Dec 02 2024 15:35:00 GMT+0100 (Central European Standard Time)
    // We can try sending the basic toString()
    const url = `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/partenze/${stationId}/${encodeURIComponent(dateObj.toString())}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch from ViaggiaTreno');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error("Proxy error:", err);
        res.status(500).json({ error: 'Failed to fetch real-time train data' });
    }
});

app.get('/api/study-groups', async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM study_groups');
        const groups = rows.map(g => ({
            ...g,
            from: g.fromLoc,
            members: JSON.parse(g.members || '[]')
        }));
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/study-groups', async (req, res) => {
    const g = req.body;
    console.log('[API] Creating study group:', { trainNumber: g.trainNumber, subject: g.subject, creatorId: g.creatorId });

    if (!g.id || !g.trainNumber || !g.subject || !g.creatorId) {
        console.error('[API] Missing required study group fields');
        return res.status(400).json({ error: 'Missing required fields: id, trainNumber, subject, creatorId' });
    }

    const sql = isPostgres
        ? `INSERT INTO study_groups (id, \"trainNumber\", \"trainLine\", \"departureTime\", subject, \"fromLoc\", \"creatorId\", members, \"maxMembers\") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        : `INSERT INTO study_groups (id, trainNumber, trainLine, departureTime, subject, fromLoc, creatorId, members, maxMembers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
        await db.query(sql, [
            g.id,
            g.trainNumber,
            g.trainLine,
            g.departureTime,
            g.subject,
            g.from,
            g.creatorId,
            JSON.stringify(g.members),
            g.maxMembers
        ]);
        console.log('[API] Study group created successfully:', g.id);
        res.json({ message: 'Study group created', id: g.id });
    } catch (err) {
        console.error('[API] Error creating study group:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/study-groups/:id/join', async (req, res) => {
    const { userId } = req.body;
    try {
        // 1. Get current members
        const selectSql = isPostgres
            ? 'SELECT members, "maxMembers" FROM study_groups WHERE id = ?'
            : 'SELECT members, maxMembers FROM study_groups WHERE id = ?';
        const rows = await db.query(selectSql, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Group not found' });

        let members = JSON.parse(rows[0].members || '[]');
        if (members.includes(userId)) return res.json({ message: 'Already joined' });
        if (members.length >= rows[0].maxMembers) return res.status(400).json({ error: 'Group full' });

        members.push(userId);

        // 2. Update
        await db.query('UPDATE study_groups SET members = ? WHERE id = ?', [JSON.stringify(members), req.params.id]);
        res.json({ message: 'Joined group', members });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/study-groups/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM study_groups WHERE id = ?', [req.params.id]);
        res.json({ message: 'Study group deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Reviews ---

// GET /api/reviews/:userId - Get reviews received by user
app.get('/api/reviews/:userId', async (req, res) => {
    try {
        const sql = isPostgres
            ? 'SELECT * FROM reviews WHERE "reviewedId" = ? ORDER BY "createdAt" DESC'
            : 'SELECT * FROM reviews WHERE reviewedId = ? ORDER BY createdAt DESC';
        const rows = await db.query(sql, [req.params.userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/rating - Get user rating stats
app.get('/api/users/:id/rating', async (req, res) => {
    try {
        const sql = isPostgres
            ? 'SELECT rating, "totalReviews" FROM users WHERE id = ?'
            : 'SELECT rating, totalReviews FROM users WHERE id = ?';
        const rows = await db.query(sql, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            rating: rows[0].rating || null,
            totalReviews: rows[0].totalReviews || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reviews - Create new review
app.post('/api/reviews', async (req, res) => {
    const { tripId, reviewerId, reviewerName, reviewedId, reviewedName, type, rating, comment } = req.body;
    
    // Validation
    if (!tripId || !reviewerId || !reviewedId || !type || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    if (comment && comment.length > 0 && comment.length < 5) {
        return res.status(400).json({ error: 'Comment must be at least 5 characters' });
    }
    
    try {
        // Check if user already reviewed this trip
        const checkSql = isPostgres
            ? 'SELECT id FROM reviews WHERE "tripId" = ? AND "reviewerId" = ?'
            : 'SELECT id FROM reviews WHERE tripId = ? AND reviewerId = ?';
        const existing = await db.query(checkSql, [tripId, reviewerId]);
        
        if (existing.length > 0) {
            return res.status(409).json({ error: 'ALREADY_REVIEWED' });
        }
        
        // Verify user participated in the trip
        const tripSql = isPostgres
            ? 'SELECT * FROM trips WHERE id = ?'
            : 'SELECT * FROM trips WHERE id = ?';
        const trips = await db.query(tripSql, [tripId]);
        
        if (trips.length === 0) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        
        const trip = trips[0];
        const passengerIds = JSON.parse(trip.passengerIds || '[]');
        
        // Check if reviewer is driver or passenger of this trip
        const isDriver = trip.driverId === reviewerId;
        const isPassenger = passengerIds.includes(reviewerId);
        
        if (!isDriver && !isPassenger) {
            return res.status(403).json({ error: 'NOT_PARTICIPANT' });
        }
        
        // Check if reviewed user is the other party
        const isReviewingDriver = type === 'passenger_to_driver';
        const isReviewingPassenger = type === 'driver_to_passenger';
        
        if (isReviewingDriver && trip.driverId !== reviewedId) {
            return res.status(400).json({ error: 'INVALID_REVIEWEE' });
        }
        
        if (isReviewingPassenger && !passengerIds.includes(reviewedId)) {
            return res.status(400).json({ error: 'INVALID_REVIEWEE' });
        }
        
        // Create the review
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        
        const insertSql = isPostgres
            ? `INSERT INTO reviews (id, "tripId", "reviewerId", "reviewerName", "reviewedId", "reviewedName", type, rating, comment, "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            : `INSERT INTO reviews (id, tripId, reviewerId, reviewerName, reviewedId, reviewedName, type, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        await db.query(insertSql, [id, tripId, reviewerId, reviewerName, reviewedId, reviewedName, type, rating, comment || null, createdAt]);
        
        // Update user's rating average
        const statsSql = isPostgres
            ? 'SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE "reviewedId" = ?'
            : 'SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE reviewedId = ?';
        const stats = await db.query(statsSql, [reviewedId]);
        
        const newRating = stats[0].avgRating;
        const newTotalReviews = stats[0].count;
        
        const updateUserSql = isPostgres
            ? `UPDATE users SET rating = ?, "totalReviews" = ? WHERE id = ?`
            : `UPDATE users SET rating = ?, totalReviews = ? WHERE id = ?`;
        
        await db.query(updateUserSql, [newRating, newTotalReviews, reviewedId]);
        
        res.json({ 
            message: 'Review created', 
            id,
            newRating,
            newTotalReviews
        });
    } catch (err) {
        console.error('[Reviews] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/trips/:tripId/participants - Get trip participants (for review modal)
app.get('/api/trips/:tripId/participants', async (req, res) => {
    try {
        const sql = isPostgres
            ? 'SELECT * FROM trips WHERE id = ?'
            : 'SELECT * FROM trips WHERE id = ?';
        const rows = await db.query(sql, [req.params.tripId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        
        const trip = rows[0];
        const passengerIds = JSON.parse(trip.passengerIds || '[]');
        
        // Get passenger details
        const passengers = [];
        for (const pid of passengerIds) {
            const userSql = isPostgres
                ? 'SELECT id, name, rating, "totalReviews" FROM users WHERE id = ?'
                : 'SELECT id, name, rating, totalReviews FROM users WHERE id = ?';
            const users = await db.query(userSql, [pid]);
            if (users.length > 0) {
                passengers.push(users[0]);
            }
        }
        
        res.json({
            tripId: trip.id,
            driver: {
                id: trip.driverId,
                name: trip.driverName,
                rating: trip.driverRating || null,
                totalReviews: trip.driverTotalReviews || 0
            },
            passengers
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- User Trips Stats (for Profile) ---

// GET /api/users/:id/trips-stats - Get aggregated trip statistics for a user
app.get('/api/users/:id/trips-stats', async (req, res) => {
    const userId = req.params.id;
    const now = new Date().toISOString();
    
    try {
        // Get all completed trips where user is driver OR passenger
        const tripsSql = isPostgres
            ? 'SELECT * FROM trips WHERE "departureTime" < ?'
            : 'SELECT * FROM trips WHERE departureTime < ?';
        const allTrips = await db.query(tripsSql, [now]);
        
        let totalAsDriver = 0;
        let totalAsPassenger = 0;
        let totalCo2Saved = 0;
        let totalDistanceKm = 0;
        
        for (const trip of allTrips) {
            const passengerIds = JSON.parse(trip.passengerIds || '[]');
            const isDriver = trip.driverId === userId;
            const isPassenger = passengerIds.includes(userId);
            
            if (isDriver) {
                totalAsDriver++;
                totalCo2Saved += (trip.co2Saved || 0);
                totalDistanceKm += (trip.distanceKm || 0);
            } else if (isPassenger) {
                totalAsPassenger++;
                // For passengers, calculate proportional CO2 and distance based on share
                const passengerCount = passengerIds.length;
                if (passengerCount > 0) {
                    totalCo2Saved += ((trip.co2Saved || 0) / passengerCount);
                    totalDistanceKm += ((trip.distanceKm || 0) / passengerCount);
                }
            }
        }
        
        res.json({
            totalAsDriver,
            totalAsPassenger,
            totalCo2Saved: Math.round(totalCo2Saved * 100) / 100,
            totalDistanceKm: Math.round(totalDistanceKm * 100) / 100
        });
    } catch (err) {
        console.error('[Trips Stats] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/completed-trips - Get list of completed trips for a user
app.get('/api/users/:id/completed-trips', async (req, res) => {
    const userId = req.params.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const now = new Date().toISOString();
    
    try {
        // Get all completed trips where user is driver OR passenger
        const tripsSql = isPostgres
            ? 'SELECT * FROM trips WHERE "departureTime" < ? ORDER BY "departureTime" DESC'
            : 'SELECT * FROM trips WHERE departureTime < ? ORDER BY departureTime DESC';
        const allTrips = await db.query(tripsSql, [now]);
        
        // Filter trips where user participated
        const userTrips = [];
        for (const trip of allTrips) {
            const passengerIds = JSON.parse(trip.passengerIds || '[]');
            const isDriver = trip.driverId === userId;
            const isPassenger = passengerIds.includes(userId);
            
            if (isDriver || isPassenger) {
                userTrips.push({
                    ...trip,
                    from: trip.fromLoc,
                    to: trip.toLoc,
                    role: isDriver ? 'driver' : 'passenger'
                });
            }
        }
        
        // Apply pagination
        const paginatedTrips = userTrips.slice(offset, offset + limit);
        
        res.json({
            trips: paginatedTrips,
            total: userTrips.length,
            hasMore: offset + limit < userTrips.length
        });
    } catch (err) {
        console.error('[Completed Trips] Error:', err);
        res.status(500).json({ error: err.message });
    }
});


module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
