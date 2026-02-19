require('dotenv').config();
const pg = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  // Check verifier record
  const result = await pool.query('SELECT id, email, password, "isActive", "isEmailVerified" FROM verifiers WHERE email = $1', ['adityamathan@codemateai.dev']);

  if (result.rows.length === 0) {
    console.log('❌ No verifier found with email adityamathan@codemateai.dev');
    await pool.end();
    return;
  }

  const verifier = result.rows[0];
  console.log('✅ Verifier found:', {
    id: verifier.id,
    email: verifier.email,
    isActive: verifier.isActive,
    isEmailVerified: verifier.isEmailVerified,
    passwordPrefix: verifier.password.substring(0, 10),
    passwordLength: verifier.password.length,
    isBcryptHash: verifier.password.startsWith('$2')
  });

  // Test bcrypt comparison
  const testPassword = 'Aditya@12345';
  const isMatch = await bcrypt.compare(testPassword, verifier.password);
  console.log('🔐 Password match test:', isMatch ? '✅ PASS' : '❌ FAIL');

  if (!isMatch) {
    console.log('Stored password:', verifier.password);
    console.log('Expected hash of:', testPassword);
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('Fresh hash would be:', newHash);
  }

  await pool.end();
}

main().catch(console.error);
