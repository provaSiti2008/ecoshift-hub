require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// Configuration
const SQLITE_DB_PATH = path.resolve(__dirname, 'ecoshift.db');
// Explicitly prefer the Supabase URL
const POSTGRES_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
    console.error('❌ Error: No Postgres URL found in environment variables.');
    process.exit(1);
}

// Connect to SQLite
const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ Error opening SQLite database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite source database.');
});

// Connect to Postgres
const pgPool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

// Helper to get data from SQLite
function getSqliteData(table) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(`SELECT * FROM ${table}`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Helper to insert into Postgres
async function migrateTable(tableName, rows, conflictColumn = 'id') {
    if (rows.length === 0) {
        console.log(`ℹ️  No rows to migrate for table '${tableName}'.`);
        return;
    }

    console.log(`🚀 Migrating ${rows.length} rows for table '${tableName}'...`);

    let successCount = 0;
    let errorCount = 0;

    const client = await pgPool.connect();
    try {
        for (const row of rows) {
            const keys = Object.keys(row);
            // Quote keys to handle case sensitivity in Postgres (e.g. "emailVerified")
            // But we need to match the actual column names in Postgres.
            // Based on database.js, columns might be created without quotes (lowercase) or with quotes.
            // Best approach: Use parameter bindings ($1, $2...) and simple column names.
            // If the column name in SQLite matches Postgres, great.
            // Exceptions: 'emailVerified' vs "emailVerified" vs emailverified.
            // We'll wrap identifiers in double quotes just in case to preserve case sensitivity if it exists.

            const columns = keys.map(k => `"${k}"`).join(', ');
            const values = Object.values(row);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            const query = `
                INSERT INTO ${tableName} (${columns}) 
                VALUES (${placeholders})
                ON CONFLICT (${conflictColumn}) DO NOTHING
            `;

            try {
                await client.query(query, values);
                successCount++;
            } catch (err) {
                // If column error ("accessibilityNeeds" etc.), try to adjust?
                // For now, log and continue.
                console.error(`   ⚠️  Failed to insert row ${row[conflictColumn]}: ${err.message}`);
                errorCount++;
            }
        }
    } finally {
        client.release();
    }

    console.log(`✅ Table '${tableName}': ${successCount} migrated, ${errorCount} failed/skipped.`);
}

async function runMigration() {
    try {
        console.log('Starting migration...');

        // 1. Users
        const users = await getSqliteData('users');
        await migrateTable('users', users, 'id');

        // 2. Trips
        const trips = await getSqliteData('trips');
        await migrateTable('trips', trips, 'id');

        // 3. Messages
        const messages = await getSqliteData('messages');
        await migrateTable('messages', messages, 'id');

        // 4. Notifications
        const notifications = await getSqliteData('notifications');
        await migrateTable('notifications', notifications, 'id');

        // 5. Credit Logs
        const creditLogs = await getSqliteData('credit_logs');
        await migrateTable('credit_logs', creditLogs, 'id');

        // 6. Study Groups
        try {
            const studyGroups = await getSqliteData('study_groups');
            await migrateTable('study_groups', studyGroups, 'id');
        } catch (err) {
            console.log('ℹ️  Skipping study_groups (table might not exist in SQLite source).');
        }

        console.log('\n✨ Migration completed!');
    } catch (err) {
        console.error('\n❌ Migration failed:', err);
    } finally {
        sqliteDb.close();
        pgPool.end();
    }
}

runMigration();
