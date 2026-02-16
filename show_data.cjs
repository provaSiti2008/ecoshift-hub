const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.rhvwwgfyrzlrxtlvemsf:BabiGi%407408.02@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function showTableData() {
  try {
    console.log('\n📊 DATI REGISTRATI NEL DATABASE\n');
    console.log('=====================================\n');

    // 1. USERS
    console.log('👤 TABELLA: users');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`   Record totali: ${usersCount.rows[0].count}`);
    
    const users = await pool.query('SELECT id, name, role, credits, theme FROM users LIMIT 5');
    if (users.rows.length > 0) {
      console.log('   Ultimi 5 utenti:');
      users.rows.forEach((u, i) => {
        console.log(`   ${i+1}. ${u.name} (${u.id}) - ${u.role} - ${u.credits} crediti${u.theme ? ' - Tema: ' + u.theme : ''}`);
      });
    }
    console.log('');

    // 2. TRIPS
    console.log('🚗 TABELLA: trips');
    const tripsCount = await pool.query('SELECT COUNT(*) FROM trips');
    console.log(`   Record totali: ${tripsCount.rows[0].count}`);
    
    const trips = await pool.query('SELECT id, "driverName", "fromLoc", "toLoc", "seatsAvailable", "departureTime" FROM trips LIMIT 5');
    if (trips.rows.length > 0) {
      console.log('   Ultimi 5 viaggi:');
      trips.rows.forEach((t, i) => {
        console.log(`   ${i+1}. ${t.fromLoc} → ${t.toLoc} (${t.driverName}) - ${t.seatsAvailable} posti`);
      });
    }
    console.log('');

    // 3. STUDY_GROUPS
    console.log('📚 TABELLA: study_groups');
    const groupsCount = await pool.query('SELECT COUNT(*) FROM study_groups');
    console.log(`   Record totali: ${groupsCount.rows[0].count}`);
    
    const groups = await pool.query('SELECT id, "trainNumber", subject, "fromLoc" FROM study_groups LIMIT 5');
    if (groups.rows.length > 0) {
      console.log('   Ultimi 5 gruppi:');
      groups.rows.forEach((g, i) => {
        console.log(`   ${i+1}. Treno ${g["trainNumber"]} - ${g.subject} (${g["fromLoc"]})`);
      });
    }
    console.log('');

    // 4. MESSAGES
    console.log('💬 TABELLA: messages');
    const msgsCount = await pool.query('SELECT COUNT(*) FROM messages');
    console.log(`   Record totali: ${msgsCount.rows[0].count}`);
    
    try {
      const msgs = await pool.query('SELECT id, "senderName", text, timestamp, "attachmentUrl" FROM messages ORDER BY timestamp DESC LIMIT 5');
      if (msgs.rows.length > 0) {
        console.log('   Ultimi 5 messaggi:');
        msgs.rows.forEach((m, i) => {
          const hasAttachment = m["attachmentUrl"] ? ' [📎 Allegato]' : '';
          console.log(`   ${i+1}. ${m["senderName"]}: ${m.text?.substring(0, 40)}${m.text?.length > 40 ? '...' : ''}${hasAttachment}`);
        });
      }
    } catch (e) {
      // Se le colonne non esistono, mostra solo i dati base
      const msgs = await pool.query('SELECT id, "senderName", text, timestamp FROM messages ORDER BY timestamp DESC LIMIT 5');
      if (msgs.rows.length > 0) {
        console.log('   Ultimi 5 messaggi:');
        msgs.rows.forEach((m, i) => {
          console.log(`   ${i+1}. ${m["senderName"]}: ${m.text?.substring(0, 40)}${m.text?.length > 40 ? '...' : ''}`);
        });
      }
    }
    console.log('');

    // 5. ATTACHMENTS
    console.log('📎 TABELLA: attachments');
    try {
      const attachCount = await pool.query('SELECT COUNT(*) FROM attachments');
      console.log(`   Record totali: ${attachCount.rows[0].count}`);
      
      const attachments = await pool.query('SELECT id, "fileName", "messageId", "createdAt" FROM attachments ORDER BY "createdAt" DESC LIMIT 5');
      if (attachments.rows.length > 0) {
        console.log('   Ultimi 5 allegati:');
        attachments.rows.forEach((a, i) => {
          console.log(`   ${i+1}. ${a["fileName"]} (Msg: ${a["messageId"]?.substring(0, 8)}...)`);
        });
      }
    } catch (e) {
      console.log('   ⚠️ Tabella attachments non esiste ancora su Supabase');
    }
    console.log('');

    // 6. NOTIFICATIONS
    console.log('🔔 TABELLA: notifications');
    const notifCount = await pool.query('SELECT COUNT(*) FROM notifications');
    console.log(`   Record totali: ${notifCount.rows[0].count}`);
    
    const notifs = await pool.query('SELECT id, text, read, type, timestamp FROM notifications ORDER BY timestamp DESC LIMIT 5');
    if (notifs.rows.length > 0) {
      console.log('   Ultime 5 notifiche:');
      notifs.rows.forEach((n, i) => {
        console.log(`   ${i+1}. ${n.text?.substring(0, 50)}${n.text?.length > 50 ? '...' : ''} ${n.read ? '✓' : '✗'}`);
      });
    }
    console.log('');

    // 7. CREDIT_LOGS
    console.log('💰 TABELLA: credit_logs');
    const logsCount = await pool.query('SELECT COUNT(*) FROM credit_logs');
    console.log(`   Record totali: ${logsCount.rows[0].count}`);
    
    try {
      const logs = await pool.query('SELECT "userId", amount, reason, timestamp FROM credit_logs ORDER BY timestamp DESC LIMIT 5');
      if (logs.rows.length > 0) {
        console.log('   Ultimi 5 log:');
        logs.rows.forEach((l, i) => {
          console.log(`   ${i+1}. User ${l["userId"]?.substring(0, 8)}... ${l.amount > 0 ? '+' : ''}${l.amount} crediti - ${l.reason?.substring(0, 40)}`);
        });
      }
    } catch (e) {
      console.log('   ⚠️ Errore nel leggere i credit logs');
    }
    console.log('');

    console.log('=====================================\n');

  } catch (err) {
    console.error('❌ Errore:', err.message);
  } finally {
    await pool.end();
  }
}

showTableData();
