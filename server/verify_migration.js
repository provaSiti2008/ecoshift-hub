require('dotenv').config();
const { query, isPostgres } = require('./database');

async function check() {
    console.log(`Checking database (isPostgres: ${isPostgres})...`);
    try {
        const users = await query('SELECT id FROM users');
        console.log(`User count: ${users.length}`);
        console.log('Users:', users.map(u => u.id));

        const trips = await query('SELECT id FROM trips');
        console.log(`Trip count: ${trips.length}`);
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
