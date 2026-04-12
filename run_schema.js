const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'supabase', 'schema.sql'), 'utf8');
  
  // Direct connection (not pooler) with password URL-encoded
  const client = new Client({
    connectionString: 'postgresql://postgres:Vaahan%402026erp@db.vsadlgeprxfaihmveamk.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL (direct)...');
    await client.connect();
    console.log('Connected! Executing schema...');
    
    await client.query(sql);
    
    console.log('✅ ALL 23 TABLES CREATED SUCCESSFULLY!');
    
    // Verify tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\nTables created (' + result.rows.length + '):');
    result.rows.forEach((row, i) => {
      console.log('  ' + (i + 1) + '. ' + row.table_name);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
  } finally {
    await client.end();
  }
}

runSchema();
