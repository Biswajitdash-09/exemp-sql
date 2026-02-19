require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const email = 'biswajit.dash@codemateai.dev';
  
  console.log(`🗑️ Removing user data for: ${email}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // 1. Get the verifier ID first
    const verifierRes = await pool.query('SELECT id FROM verifiers WHERE email = $1', [email.toLowerCase()]);
    
    if (verifierRes.rows.length > 0) {
      const verifierId = verifierRes.rows[0].id;
      
      // 2. Delete related verification records and attempts
      // Note: Depending on foreign key constraints, these might need careful order or might not exist
      await pool.query('DELETE FROM verification_attempts WHERE "verifierId" = $1', [verifierId]);
      await pool.query('DELETE FROM access_logs WHERE email = $1', [email.toLowerCase()]);
      
      // 3. Delete the verifier
      await pool.query('DELETE FROM verifiers WHERE id = $1', [verifierId]);
      console.log(`✅ Verifier "${email}" removed.`);
    } else {
      console.log(`ℹ️ Verifier "${email}" not found in database.`);
    }
    
    // 4. Clean up any OTPs
    const otpRes = await pool.query('DELETE FROM otps WHERE email = $1', [email.toLowerCase()]);
    if (otpRes.rowCount > 0) {
      console.log(`✅ OTP records for "${email}" removed.`);
    }

  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await pool.end();
  }
}

main();
