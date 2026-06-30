/**
 * Pre-încărcarea documentelor normative în DMS (Faza 5, §2.3).
 *
 * Idempotent: verifică title înainte de inserare, nu dublează.
 * Rulare: npm run db:seed:docs
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('../src/db');

const GHID_FILENAME = 'ghidul-bioinginerului-2024.md';
const GHID_URL = `/api/documents/file/${GHID_FILENAME}`;
const GHID_ABSOLUTE = path.join(__dirname, '../uploads/documents', GHID_FILENAME);

const GHID_SIZE = fs.existsSync(GHID_ABSOLUTE)
  ? fs.statSync(GHID_ABSOLUTE).size
  : 0;

const GHID_MIME = 'text/markdown';

const adminUser = () => prisma.users.findFirst({
  where: { username: 'admin' },
  select: { id: true },
});

const DOCUMENTS = [
  // ── LEGISLAȚIE ──────────────────────────────────────────────
  {
    title: 'Ghidul bioinginerului în domeniul dispozitivelor medicale (ediția II, 2024)',
    category: 'LEGISLATIE',
    description: 'Ordinul MS nr. 889 din 31.10.2024 — ghid normativ pentru bioinginerul medical. Sursa de referință pentru toate procedurile MDM.',
    tags: ['normativ', 'ghid', '889/2024', 'ORDIN MS'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },

  // ── FORMULARE (Nr. 1–12) ────────────────────────────────────
  {
    title: 'Formular Nr. 1 — Plan de procurare a dispozitivelor medicale',
    category: 'FORMULAR',
    description: 'Anexa nr. 6. Șablon pentru planificarea anuală a procurării DM. Completați cu datele instituției.',
    tags: ['formular', 'procurare', 'planificare'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Formular Nr. 2 — Plan de procurare a consumabilelor și pieselor de schimb',
    category: 'FORMULAR',
    description: 'Anexa nr. 7. Șablon pentru planificarea procurării consumabilelor și pieselor de schimb.',
    tags: ['formular', 'consumabile', 'piese schimb'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Formular Nr. 3 — Act de predare-primire a bunurilor materiale',
    category: 'FORMULAR',
    description: 'Anexa nr. 9. Formular pentru predarea-primirea DM între structuri sau la schimbarea responsabilului.',
    tags: ['formular', 'predare-primire', 'bunuri'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Formular Nr. 4 — Formular de dare în exploatare a DM',
    category: 'FORMULAR',
    description: 'Anexa nr. 10. Completare la instalarea și darea în exploatare a unui dispozitiv medical nou.',
    tags: ['formular', 'exploatare', 'installare'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Formular Nr. 5 — Plan de mentenanță preventivă a DM',
    category: 'FORMULAR',
    description: 'Anexa nr. 16. Grila anuală (Ian–Dec) pentru planificarea mentenanței preventive. Utilizat în Procedura MDM Nr. 6.',
    tags: ['formular', 'mentenanță', 'preventiv', 'plan'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Formular Nr. 6 — Fișa de mentenanță a DM',
    category: 'FORMULAR',
    description: 'Anexa nr. 2. Fișă pentru înregistrarea intervențiilor de mentenanță preventivă. Utilizat în Procedura MDM Nr. 7.',
    tags: ['formular', 'mentenanță', 'fișă'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Formular Nr. 7 — Chemări',
    category: 'FORMULAR',
    description: 'Anexa nr. 23. Formular pentru evidența chemărilor de întreținere.',
    tags: ['formular', 'chemări', 'întreținere'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Formular Nr. 8 — Fișa de deservire a DM (Bon reparație intern)',
    category: 'FORMULAR',
    description: 'Anexa nr. 3. Fișă de intervenție pentru mentenanță corectivă internă. Utilizat în Procedura MDM Nr. 8.',
    tags: ['formular', 'reparație', 'deservire', 'bon'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Formular Nr. 9 — Act de predare-primire a DM la externalizare',
    category: 'FORMULAR',
    description: 'Anexa nr. 21. Formular pentru predarea-primirea DM în cazul externalizării serviciilor de mentenanță. Utilizat în Procedura MDM Nr. 4.',
    tags: ['formular', 'externalizare', 'predare-primire'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Formular Nr. 10 — Formular de casare a DM',
    category: 'FORMULAR',
    description: 'Anexa nr. 28 (parțial). Formular pentru procesul de casare a dispozitivelor medicale. Utilizat în Procedura MDM Nr. 10.',
    tags: ['formular', 'casare', 'casare DM'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Formular Nr. 11 — Jurnal de Gardă',
    category: 'FORMULAR',
    description: 'Anexa nr. 4. Jurnal pentru evidența intervențiilor în gardă pe timp de noapte și zile de odihnă.',
    tags: ['formular', 'jurnal', 'gardă'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Formular Nr. 12 — Raport de incident',
    category: 'FORMULAR',
    description: 'Anexa nr. 28 (complet). Formular pentru raportarea incidentelor legate de dispozitive medicale.',
    tags: ['formular', 'incident', 'raportare'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },

  // ── PROCEDURI MDM (Nr. 1–10) ────────────────────────────────
  {
    title: 'Procedura MDM Nr. 1 — Inventarierea anuală planificată a DM',
    category: 'PROCEDURA_MDM',
    description: 'Anexa nr. 14. Procedură pentru inventarierea anuală a dispozitivelor medicale de către D/SIBM.',
    tags: ['procedură', 'inventar', 'anual', 'MDM'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Procedura MDM Nr. 2 — Planificarea procurării de DM, consumabile și piese de schimb',
    category: 'PROCEDURA_MDM',
    description: 'Anexa nr. 5. Procedură pentru planificarea și procesul de procurare a DM, consumabilelor și pieselor de schimb.',
    tags: ['procedură', 'procurare', 'planificare', 'MDM'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Procedura MDM Nr. 3 — Darea în exploatare a DM',
    category: 'PROCEDURA_MDM',
    description: 'Anexa nr. 8. Procedură pentru recepția, instalarea și darea în exploatare a DM noi.',
    tags: ['procedură', 'exploatare', 'installare', 'MDM'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Procedura MDM Nr. 4 — Managementul contractelor de mentenanță',
    category: 'PROCEDURA_MDM',
    description: 'Anexa nr. 20. Procedură pentru gestionarea contractelor de mentenanță externă și evaluarea furnizorilor.',
    tags: ['procedură', 'contracte', 'mentenanță externă', 'MDM'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Procedura MDM Nr. 5 — Instruirea utilizatorilor de DM și a inginerilor D/SIBM',
    category: 'PROCEDURA_MDM',
    description: 'Anexa nr. 26. Procedură pentru instruirea periodică a utilizatorilor și a personalului ingineresc.',
    tags: ['procedură', 'instruire', 'utilizatori', 'MDM'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Procedura MDM Nr. 6 — Planificarea mentenanței preventive a DM',
    category: 'PROCEDURA_MDM',
    description: 'Anexa nr. 15. Procedură pentru elaborarea planului anual de mentenanță preventivă. Utilizează Formular Nr. 5.',
    tags: ['procedură', 'mentenanță', 'preventiv', 'planificare', 'MDM'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Procedura MDM Nr. 7 — Implementarea planului de mentenanță preventivă a DM',
    category: 'PROCEDURA_MDM',
    description: 'Anexa nr. 17. Procedură pentru executarea efectivă a mentenanței preventive planificate. Utilizează Formulare Nr. 6 și Nr. 8.',
    tags: ['procedură', 'mentenanță', 'preventiv', 'implementare', 'MDM'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  {
    title: 'Procedura MDM Nr. 8 — Mentenanța corectivă a DM',
    category: 'PROCEDURA_MDM',
    description: 'Anexa nr. 19. Procedură pentru repararea DM defecte: raportare, diagnosticare, reparație, testare. Utilizează Formulare Nr. 6, Nr. 8, Nr. 11.',
    tags: ['procedură', 'mentenanță', 'corectiv', 'reparație', 'MDM'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
  // MDM Nr. 9 nu există în Ghid (sărit de la 8 la 10)
  {
    title: 'Procedura MDM Nr. 10 — Casarea DM de către D/SIBM',
    category: 'PROCEDURA_MDM',
    description: 'Anexa nr. 22. Procedură pentru casarea și scoaterea din evidență a DM nefuncționale. Utilizează Formular Nr. 10.',
    tags: ['procedură', 'casare', 'DM', 'MDM'],
    fileUrl: GHID_URL,
    fileSize: GHID_SIZE,
    mimeType: GHID_MIME,
    version: '1.0',
  },
];

async function main() {
  console.log('📄 SIMDM — Pre-încărcare documente normative în DMS...\n');

  const admin = await adminUser();
  if (!admin) {
    console.error('❌ Utilizator admin negăsit. Rulează mai întâi `npm run db:seed`.');
    process.exit(1);
  }
  console.log(`👤 Utilizator: admin (ID: ${admin.id})\n`);

  let created = 0;
  let skipped = 0;

  for (const doc of DOCUMENTS) {
    const existing = await prisma.documents.findFirst({
      where: { title: doc.title },
      select: { id: true },
    });

    if (existing) {
      console.log(`  ⏭️  ${doc.title} — există déjà (ID: ${existing.id})`);
      skipped++;
      continue;
    }

    await prisma.documents.create({
      data: {
        title: doc.title,
        category: doc.category,
        description: doc.description,
        tags: doc.tags,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        version: doc.version,
        isCurrent: true,
        isDeleted: false,
        uploadedById: admin.id,
        updatedAt: new Date(),
      },
    });

    console.log(`  ✅ ${doc.title}`);
    created++;
  }

  console.log(`\n📊 Rezumat: ${created} creat(e), ${skipped} sărit(e) (deja existau), ${DOCUMENTS.length} total`);
}

main()
  .catch((e) => {
    console.error('❌ Eroare la pre-încărcarea documentelor:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
