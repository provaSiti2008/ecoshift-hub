-- Abilita l'estensione pgcrypto per generare UUID (opzionale, se servisse in futuro)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    skills TEXT,
    "accessibilityNeeds" TEXT,
    credits INTEGER,
    password TEXT,
    "emailVerified" INTEGER DEFAULT 1
);

-- Trips Table
CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    "driverId" TEXT,
    "driverName" TEXT,
    "fromLoc" TEXT,
    "toLoc" TEXT,
    "departureTime" TEXT,
    "seatsAvailable" INTEGER,
    "distanceKm" REAL,
    "co2Saved" REAL,
    "tutoringSubject" TEXT,
    "assistanceOffered" INTEGER,
    "specialEquipment" TEXT,
    "passengerIds" TEXT
);

-- Credit Logs
CREATE TABLE IF NOT EXISTS credit_logs (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    amount INTEGER,
    reason TEXT,
    timestamp TEXT
);

-- Messages (Chat)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    "tripId" TEXT,
    "senderId" TEXT,
    "senderName" TEXT,
    text TEXT,
    timestamp TEXT
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    text TEXT,
    read INTEGER,
    type TEXT,
    timestamp TEXT
);

-- Study Groups
CREATE TABLE IF NOT EXISTS study_groups (
    id TEXT PRIMARY KEY,
    "trainNumber" TEXT,
    "trainLine" TEXT,
    "departureTime" TEXT,
    subject TEXT,
    "fromLoc" TEXT,
    "creatorId" TEXT,
    members TEXT,
    "maxMembers" INTEGER
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    token TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    expires TEXT NOT NULL
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    expires TEXT NOT NULL
);
