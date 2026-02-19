require('dotenv').config();
const pg = require('pg');

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  console.log('📋 Last 10 Access Logs (Raw):');
  const result = await pool.query('SELECT timestamp, email, role, action, status, "failureReason", "ipAddress" FROM access_logs ORDER BY timestamp DESC LIMIT 10');
  
  result.rows.forEach(log => {
    console.log(`[${log.timestamp.toISOString()}] Email: "${log.email}" | Status: ${log.status} | Reason: ${log.failureReason || 'None'}`);
  });

  await pool.end();
}

main().catch(console.error);
