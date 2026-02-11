require('dotenv').config();
const { Pool } = require('pg');
const pgUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
const pool = new Pool({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
async function test() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications'");
        console.log('COLS:', res.rows.map(r => r.column_name).join(','));
    } catch (err) {
        console.error('ERR:', err.message);
    } finally {
        await pool.end();
    }
}
test();
