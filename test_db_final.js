import pg from 'pg';
const { Pool } = pg;

const ref = 'rhvwwgfyrzlrxtlvemsf';
const pass = 'BabiGi@7408.02';

async function test() {
    console.log(`--- Testing: Pooler with DB name routing ---`);
    const pool = new Pool({
        user: 'postgres',
        host: 'aws-0-eu-west-1.pooler.supabase.com',
        database: `postgres.${ref}`,
        password: pass,
        port: 6543,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        const res = await pool.query('SELECT 1');
        console.log(`SUCCESS!`);
    } catch (e) {
        console.log(`FAILED: ${e.message}`);
    } finally {
        await pool.end();
    }
}

test();
