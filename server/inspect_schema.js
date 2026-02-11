require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const POSTGRES_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspectSchema() {
    try {
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users'
                AND table_schema = 'public'
                ORDER BY column_name;
            `);
            const colNames = res.rows.map(row => row.column_name);
            fs.writeFileSync('public_columns.txt', colNames.length > 0 ? colNames.join('\n') : 'NO_COLUMNS_FOUND');
            console.log('Columns written to public_columns.txt');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

inspectSchema();
