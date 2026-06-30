/**
 * Restore script — restore dintr-un fișier de backup.
 * Rulare: node scripts/restore.js <backup-filename>
 * ATENȚIE: Suprascrie datele existente!
 */
require('dotenv').config();
const { execSync } = require('child_process');
const readline = require('readline');

const BACKUP_DIR = path.join(__dirname, '../backups');
const filename = process.argv[2];

if (!filename) {
  console.error('❌ Specifică fișierul de backup: node scripts/restore.js <filename.sql>');
  console.log('\nBackup-uri disponibile:');
  if (fs.existsSync(BACKUP_DIR)) {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql')).sort().reverse();
    files.forEach(f => console.log(`  📄 ${f}`));
  }
  process.exit(1);
}

const filepath = path.join(BACKUP_DIR, filename);

if (!fs.existsSync(filepath)) {
  console.error(`❌ Fișier negăsit: ${filepath}`);
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question(`⚠️  ATENȚIE: Această operațiune suprascrie toate datele!\nFișier: ${filename}\nConfirmă (da/nu): `, (answer) => {
  rl.close();
  if (answer.toLowerCase() !== 'da') {
    console.log('❌ Operațiune anulată.');
    process.exit(0);
  }

  try {
    console.log(`📦 Restore pornit: ${filename}`);
    execSync(`psql "${process.env.DATABASE_URL}" < "${filepath}"`, { stdio: 'inherit' });
    console.log('✅ Restore completat cu succes!');
  } catch (error) {
    console.error('❌ Restore eșuat:', error.message);
    process.exit(1);
  }
});
