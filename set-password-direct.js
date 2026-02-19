require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const email = 'biswajit.dash@codemateai.dev';
  const password = 'biswajit.dash@codemateai.dev';
  
  console.log(`🔐 Setting password for: ${email} via direct SQL`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const checkRes = await pool.query('SELECT * FROM verifiers WHERE email = $1', [email.toLowerCase()]);
    
    if (checkRes.rows.length > 0) {
      // Update
      await pool.query(
        'UPDATE verifiers SET password = $1, "isActive" = true, "isEmailVerified" = true WHERE email = $2',
        [hashedPassword, email.toLowerCase()]
      );
      console.log('✅ Verifier password updated successfully.');
    } else {
      // Insert
      await pool.query(
        'INSERT INTO verifiers (id, "companyName", email, password, "isActive", "isEmailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [crypto.randomUUID ? crypto.randomUUID() : 'temp-id-' + Date.now(), 'codemateai.dev', email.toLowerCase(), hashedPassword, true, true]
      );
      console.log('✅ Verifier created and password set successfully.');
    }
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await pool.end();
  }
}

main();
