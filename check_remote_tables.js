import { config } from 'dotenv';
config({ path: 'server/.env' });
import pg from 'pg';
const { Pool } = pg;

async function checkTables() {
    console.log("Connecting to verify tables...");
    const pool = new Pool({
        connectionString: process.env.SUPABASE_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables found remotely:", res.rows.map(r => r.table_name).join(', '));
    } catch (err) {
        console.error("VERIFICATION ERROR:", err.message);
    } finally {
        await pool.end();
    }
}

checkTables();
