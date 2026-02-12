const express = require('express');
const cors = require('cors');
const db = require('./database');
const { isPostgres } = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Auth: register (with verification email) ---
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
        const emailVerified = 1; // Verified by default
        const params = [
            normalizedId,
            user.name,
            user.role || 'BOTH',
            JSON.stringify(user.skills || []),
            JSON.stringify(user.accessibilityNeeds || []),
            user.credits != null ? user.credits : 500,
            user.password,
            emailVerified
        ];
        const sql = isPostgres
            ? `INSERT INTO users (id, name, role, skills, "accessibilityNeeds", credits, password, "emailVerified") VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            : `INSERT INTO users (id, name, role, skills, accessibilityNeeds, credits, password, emailVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
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
            accessibilityNeeds: JSON.parse(u.accessibilityNeeds || '[]'),
            emailVerified: !!(u.emailVerified ?? u.emailverified ?? 1)
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    const user = req.body;
    const emailVerified = user.emailVerified === true || user.emailVerified === 1 ? 1 : 0;
    const params = [
        user.id,
        user.name,
        user.role,
        JSON.stringify(user.skills || []),
        JSON.stringify(user.accessibilityNeeds || []),
        user.credits,
        user.password,
        emailVerified
    ];
    const sql = isPostgres
        ? `INSERT INTO users (id, name, role, skills, "accessibilityNeeds", credits, password, "emailVerified") VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, skills = EXCLUDED.skills,
           "accessibilityNeeds" = EXCLUDED."accessibilityNeeds", credits = EXCLUDED.credits, password = EXCLUDED.password, "emailVerified" = EXCLUDED."emailVerified"`
        : `INSERT OR REPLACE INTO users (id, name, role, skills, accessibilityNeeds, credits, password, emailVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

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
        ? `INSERT INTO trips (id, driverId, driverName, fromLoc, toLoc, departureTime, seatsAvailable, distanceKm, co2Saved, tutoringSubject, assistanceOffered, specialEquipment, passengerIds)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET driverId = EXCLUDED.driverId, driverName = EXCLUDED.driverName, fromLoc = EXCLUDED.fromLoc, toLoc = EXCLUDED.toLoc,
           departureTime = EXCLUDED.departureTime, seatsAvailable = EXCLUDED.seatsAvailable, distanceKm = EXCLUDED.distanceKm, co2Saved = EXCLUDED.co2Saved,
           tutoringSubject = EXCLUDED.tutoringSubject, assistanceOffered = EXCLUDED.assistanceOffered, specialEquipment = EXCLUDED.specialEquipment, passengerIds = EXCLUDED.passengerIds`
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
    const sql = `INSERT INTO notifications (id, userId, text, read, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)`;
    try {
        await db.query(sql, [n.id, n.userId, n.text, n.read ? 1 : 0, n.type, n.timestamp]);
        res.json({ message: 'Notification added' });
    } catch (err) {
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
        const rows = await db.query('SELECT * FROM messages WHERE tripId = ? ORDER BY timestamp ASC', [req.params.tripId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/messages', async (req, res) => {
    const m = req.body;
    const sql = isPostgres
        ? `INSERT INTO messages (id, tripId, senderId, senderName, "text", timestamp) VALUES (?, ?, ?, ?, ?, ?)`
        : `INSERT INTO messages (id, tripId, senderId, senderName, text, timestamp) VALUES (?, ?, ?, ?, ?, ?)`;
    try {
        await db.query(sql, [m.id, m.tripId, m.senderId, m.senderName, m.text, m.timestamp]);
        res.json({ message: 'Message sent' });
    } catch (err) {
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
    const sql = `INSERT INTO study_groups (id, trainNumber, trainLine, departureTime, subject, fromLoc, creatorId, members, maxMembers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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
        res.json({ message: 'Study group created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/study-groups/:id/join', async (req, res) => {
    const { userId } = req.body;
    try {
        // 1. Get current members
        const rows = await db.query('SELECT members, maxMembers FROM study_groups WHERE id = ?', [req.params.id]);
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


module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
