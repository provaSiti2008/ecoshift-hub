import { config } from 'dotenv';
config({ path: 'server/.env' });
import pg from 'pg';
const { Pool } = pg;

async function testConnection() {
    // Direct connection
    const directUrl = `postgresql://postgres:${encodeURIComponent('BabiGi@7408.02')}@db.rhvwwgfyrzlrxtlvemsf.supabase.co:5432/postgres`;

    console.log("Checking direct connection...");
    const pool = new Pool({
        connectionString: directUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query('SELECT NOW()');
        console.log("SUCCESS: Connected to PostgreSQL!");
        console.log("Database time:", res.rows[0].now);

        // Check if tables exist
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables found:", tables.rows.map(r => r.table_name).join(', '));

    } catch (err) {
        console.error("CONNECTION ERROR:", err.message);
    } finally {
        await pool.end();
    }
}

testConnection();
