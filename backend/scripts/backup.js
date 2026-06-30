/**
 * Backup script — pg_dump cu rotație (păstrează ultimele N backup-uri).
 * Rulare: node scripts/backup.js
 */
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUPS = 7;

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const filename = `simdm_backup_${timestamp}.sql`;
const filepath = path.join(BACKUP_DIR, filename);

try {
  console.log(`📦 Backup pornit: ${filename}`);
  execSync(`pg_dump "${process.env.DATABASE_URL}" > "${filepath}"`, { stdio: 'inherit' });
  console.log(`✅ Backup salvat: ${filepath}`);

  // Rotație: păstrează doar ultimele N backup-uri
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('simdm_backup_') && f.endsWith('.sql'))
    .sort()
    .reverse();

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS);
    toDelete.forEach(f => {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
      console.log(`🗑️  Șters vechi: ${f}`);
    });
  }

  console.log(`📊 Total backup-uri: ${Math.min(files.length, MAX_BACKUPS)}`);
} catch (error) {
  console.error('❌ Backup eșuat:', error.message);
  process.exit(1);
}
