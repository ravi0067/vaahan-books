const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'supabase', 'schema.sql'), 'utf8');
  
  // Try Session Pooler (port 5432 through pooler hostname)
  const configs = [
    {
      name: 'Session Pooler (port 5432)',
      host: 'aws-0-ap-south-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres.vsadlgeprxfaihmveamk',
      password: 'Vaahan@2026erp',
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Direct (IPv4 forced)',
      connectionString: 'postgresql://postgres:Vaahan%402026erp@db.vsadlgeprxfaihmveamk.supabase.co:5432/postgres?sslmode=require',
      ssl: { rejectUnauthorized: false }
    }
  ];

  for (const config of configs) {
    const configName = config.name;
    delete config.name;
    const client = new Client(config);
    
    try {
      console.log('Trying: ' + configName + '...');
      await client.connect();
      console.log('Connected! Executing schema...');
      
      const statements = sql.split(';').filter(s => s.trim().length > 0);
      let success = 0;
      let errors = 0;
      
      for (const stmt of statements) {
        try {
          await client.query(stmt + ';');
          success++;
        } catch (err) {
          if (err.message.includes('already exists')) {
            success++;
          } else {
            console.error('  [ERR] ' + err.message.substring(0, 100));
            errors++;
          }
        }
      }
      
      console.log('\n✅ Execution complete: ' + success + ' succeeded, ' + errors + ' errors');
      
      const result = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);
      
      console.log('\nTables in Supabase (' + result.rows.length + '):');
      result.rows.forEach((row, i) => {
        console.log('  ' + (i + 1) + '. ' + row.table_name);
      });
      
      await client.end();
      return; // Success, exit
    } catch (err) {
      console.log('❌ Failed: ' + err.message.substring(0, 80));
      try { await client.end(); } catch(e) {}
    }
  }
  
  console.log('\n⚠️  All connection methods failed. Please use Supabase SQL Editor manually.');
}

runSchema();
