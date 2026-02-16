const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.rhvwwgfyrzlrxtlvemsf:BabiGi%407408.02@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function listTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 TABELLE NEL DATABASE:\n');
    console.log('========================\n');
    
    if (result.rows.length === 0) {
      console.log('Nessuna tabella trovata nel schema public.');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
    }
    
    console.log('\n========================');
    console.log(`Totale: ${result.rows.length} tabelle`);
    
  } catch (err) {
    console.error('❌ Errore:', err.message);
  } finally {
    await pool.end();
  }
}

listTables();
