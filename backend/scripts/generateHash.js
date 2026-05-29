const bcrypt = require('bcryptjs');

async function generateHash() {
  const parola = 'admin';
  const hash = await bcrypt.hash(parola, 12);
  console.log('\n=== BCRYPT HASH GENERATOR ===\n');
  console.log(`Parola: ${parola}`);
  console.log(`\nHash generat:\n${hash}\n`);
  console.log('Copiază hash-ul mai sus în backend/.env la ADMIN_PASSWORD_HASH=\n');
}

generateHash().catch(console.error);
