require('dotenv').config();
const path = require('path');

let db;
let isPostgres = false;

// Supabase (PostgreSQL): usa la connection string da Dashboard → Settings → Database
const pgUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (pgUrl) {
  isPostgres = true;
  const { Pool } = require('pg');
  db = new Pool({
    connectionString: pgUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log('Connected to PostgreSQL database.');
  initDb();
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(__dirname, 'ecoshift.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
      console.log('Connected to local SQLite database.');
      initDb();
    }
  });
}

// Unified Query Interface
async function query(sql, params = []) {
  if (isPostgres) {
    // Convert ? to $1, $2, etc. for Postgres
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

    try {
      const result = await db.query(pgSql, params);
      return result.rows;
    } catch (err) {
      throw err;
    }
  } else {
    // SQLite
    return new Promise((resolve, reject) => {
      // Determine if it's a SELECT or a modification
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

      if (isSelect) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      }
    });
  }
}

// Initialize Tables
async function initDb() {
  const tableQueries = [
    // Users Table
    `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            role TEXT,
            skills TEXT,
            "accessibilityNeeds" TEXT,
            credits INTEGER,
            password TEXT
        )`,
    // Trips Table
    `CREATE TABLE IF NOT EXISTS trips (
            id TEXT PRIMARY KEY,
            driverId TEXT,
            driverName TEXT,
            fromLoc TEXT,
            toLoc TEXT,
            departureTime TEXT,
            seatsAvailable INTEGER,
            distanceKm REAL,
            co2Saved REAL,
            tutoringSubject TEXT,
            assistanceOffered INTEGER,
            specialEquipment TEXT,
            passengerIds TEXT
        )`,
    // Credit Logs
    `CREATE TABLE IF NOT EXISTS credit_logs (
            id TEXT PRIMARY KEY,
            userId TEXT,
            amount INTEGER,
            reason TEXT,
            timestamp TEXT
        )`,
    // Messages (Chat)
    `CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            tripId TEXT,
            senderId TEXT,
            senderName TEXT,
            text TEXT,
            timestamp TEXT
        )`,
    // Notifications
    `CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            userId TEXT,
            text TEXT,
            read INTEGER,
            type TEXT,
            timestamp TEXT
        )`,
    // Study Groups
    `CREATE TABLE IF NOT EXISTS study_groups (
            id TEXT PRIMARY KEY,
            trainNumber TEXT,
            trainLine TEXT,
            departureTime TEXT,
            subject TEXT,
            fromLoc TEXT,
            creatorId TEXT,
            members TEXT,
            maxMembers INTEGER
        )`
  ];

  // Ensure notification table specifically (critical fix)
  try {
    await query(`CREATE TABLE IF NOT EXISTS notifications(
      id TEXT PRIMARY KEY,
      userId TEXT,
      text TEXT,
      read INTEGER,
      type TEXT,
      timestamp TEXT
    )`);
  } catch (err) {
    console.error('Error creating notifications table:', err);
  }

  // Run all other table queries
  for (const sql of tableQueries) {
    try {
      await query(sql);
    } catch (err) {
      console.error('Error running table query:', err);
    }
  }



  // Migration: Add accessibilityNeeds column if missing
  try {
    if (isPostgres) {
      await query(`ALTER TABLE users ADD COLUMN "accessibilityNeeds" TEXT`);
    } else {
      await query(`ALTER TABLE users ADD COLUMN accessibilityNeeds TEXT`);
    }
  } catch (e) {
    // Column already exists
  }

  // Migration: Add theme column if missing
  try {
    if (isPostgres) {
      await query(`ALTER TABLE users ADD COLUMN theme TEXT`);
    } else {
      await query(`ALTER TABLE users ADD COLUMN theme TEXT`);
    }
  console.log('Migration: Added theme column to users table');
  } catch (e) {
    // Column already exists
  }

  // Migration: Add attachment columns to messages if missing
  try {
    if (isPostgres) {
      await query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT`);
      await query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS "attachmentType" TEXT`);
    } else {
      await query(`ALTER TABLE messages ADD COLUMN attachmentUrl TEXT`);
      await query(`ALTER TABLE messages ADD COLUMN attachmentType TEXT`);
    }
    console.log('Migration: Added attachment columns to messages table');
  } catch (e) {
    // Column already exists
  }

  // Migration: Create attachments table if missing
  try {
    await query(`CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      messageId TEXT,
      fileName TEXT,
      contentType TEXT,
      data TEXT,
      createdAt TEXT
    )`);
    console.log('Migration: Created attachments table');
  } catch (e) {
    // Table already exists
  }

  console.log('Database tables initialized.');
}

module.exports = {
  query,
  initDb,
  isPostgres
};
