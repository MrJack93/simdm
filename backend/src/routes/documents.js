const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');
const { antivirusMiddleware } = require('../middleware/antivirus');

const router = express.Router();

const idSchema = z.coerce.number().int().positive();

const VALID_CATEGORIES = [
  'PROCEDURA_MDM', 'FORMULAR', 'LEGISLATIE', 'MANUAL_TEHNIC',
  'CERTIFICAT', 'CONTRACT', 'RAPORT', 'ALTUL',
];

const baseCreateSchema = z.object({
  title: z.string().min(2).max(255),
  category: z.enum(VALID_CATEGORIES),
  description: z.string().max(2000).optional(),
  tags: z.union([z.array(z.string().max(50)).max(20), z.string().max(2000)]).optional(),
  deviceId: z.coerce.number().int().positive().optional(),
  version: z.string().max(20).optional(),
  issuer: z.string().max(255).optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  reviewAt: z.coerce.date().optional(),
});

const createDocSchema = baseCreateSchema.superRefine((d, ctx) => {
  if (['CERTIFICAT', 'CONTRACT'].includes(d.category)) {
    if (!d.validUntil) {
      ctx.addIssue({ path: ['validUntil'], message: 'Data de expirare este obligatorie pentru certificate și contracte' });
    }
    if (!d.issuer) {
      ctx.addIssue({ path: ['issuer'], message: 'Emitentul este obligatoriu pentru certificate și contracte' });
    }
  }
});

const baseUpdateSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  deviceId: z.coerce.number().int().positive().nullable().optional(),
  issuer: z.string().max(255).nullable().optional(),
  validFrom: z.coerce.date().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
  reviewAt: z.coerce.date().nullable().optional(),
});

const updateDocSchema = baseUpdateSchema.superRefine((d, ctx) => {
  const cat = d.category;
  if (cat && ['CERTIFICAT', 'CONTRACT'].includes(cat)) {
    if (d.validUntil === null) {
      ctx.addIssue({ path: ['validUntil'], message: 'Data de expirare nu poate fi goală pentru certificate și contracte' });
    }
    if (d.issuer === null) {
      ctx.addIssue({ path: ['issuer'], message: 'Emitentul nu poate fi gol pentru certificate și contracte' });
    }
  }
});

function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* v8 ignore start -- @preserve */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    cb(null, `${timestamp}-${random}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'text/plain',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tip fișier neacceptat'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});
/* v8 ignore end */

// GET /api/documents/categories — listă categorii
router.get('/categories', async (req, res) => {
  try {
    const categories = VALID_CATEGORIES.map((c) => ({
      value: c,
      label: c.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
    }));
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Eroare la preluarea categoriilor' });
  }
});

// GET /api/documents/expiring — documente ce expiră în N zile
router.get('/expiring', async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days) || 60);
    const now = new Date();
    const deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const documents = await prisma.documents.findMany({
      where: {
        isDeleted: false,
        isCurrent: true,
        validUntil: { not: null, lte: deadline },
      },
      include: {
        uploadedBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { validUntil: 'asc' },
    });

    const data = documents.map((doc) => {
      const diffMs = doc.validUntil.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      let status;
      if (daysLeft < 0) status = 'EXPIRAT';
      else if (daysLeft <= 30) status = 'EXPIRA_CURÂND';
      else status = 'OK';
      return { ...doc, daysLeft, status };
    });

    const summary = {
      expirat: data.filter((d) => d.status === 'EXPIRAT').length,
      expiraCurand: data.filter((d) => d.status === 'EXPIRA_CURÂND').length,
    };

    res.json({ data, summary });
  } catch (error) {
    console.error('Error fetching expiring documents:', error);
    res.status(500).json({ error: 'Eroare la preluarea documentelor care expiră' });
  }
});

// GET /api/documents — listă cu filtre + paginare
router.get('/', async (req, res) => {
  try {
    const rawPage = Math.max(parseInt(req.query.page) || 1, 1);
    const rawLimit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (rawPage - 1) * rawLimit;

    const { search, category, deviceId, onlyCurrent } = req.query;
    const where = { isDeleted: false };

    if (onlyCurrent !== 'false') {
      where.isCurrent = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (deviceId) {
      const deviceParse = idSchema.safeParse(deviceId);
      if (!deviceParse.success) {
        return res.status(400).json({ error: 'ID dispozitiv invalid' });
      }
      where.deviceId = deviceParse.data;
    }

    const [documents, total] = await Promise.all([
      prisma.documents.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, fullName: true, username: true } },
          device: { select: { id: true, name: true, inventoryNumber: true } },
        },
        skip,
        take: rawLimit,
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.documents.count({ where }),
    ]);

    res.json({
      data: documents,
      pagination: {
        page: rawPage,
        limit: rawLimit,
        total,
        pages: Math.ceil(total / rawLimit),
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Eroare la preluarea documentelor' });
  }
});

// GET /api/documents/:id — detalii
router.get('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });

    const document = await prisma.documents.findUnique({
      where: { id: idParse.data },
      include: {
        uploadedBy: { select: { id: true, fullName: true, username: true } },
        device: { select: { id: true, name: true, inventoryNumber: true } },
        other_documents: {
          where: { isDeleted: false },
          orderBy: { uploadedAt: 'desc' },
          select: { id: true, title: true, version: true, uploadedAt: true, isCurrent: true },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document negăsit' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Eroare la preluarea documentului' });
  }
});

// GET /api/documents/:id/verify — verifică integritatea fișierului (SHA-256)
router.get('/:id/verify', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });

    const document = await prisma.documents.findUnique({ where: { id: idParse.data } });
    if (!document) return res.status(404).json({ error: 'Document negăsit' });

    const filename = document.fileUrl.split('/').pop();
    const filePath = path.join(__dirname, '../../uploads/documents', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fișier negăsit pe disc' });
    }

    const currentHash = await computeFileHash(filePath);
    const valid = document.fileHash ? currentHash === document.fileHash : null;

    await prisma.audit_logs.create({
      data: {
        userId: req.user.sub,
        action: 'VERIFY',
        entity: 'Document',
        entityId: String(document.id),
        changes: { valid, storedHash: document.fileHash, currentHash },
      },
    });

    res.json({
      valid,
      storedHash: document.fileHash || null,
      currentHash,
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({ error: 'Eroare la verificarea documentului' });
  }
});

// GET /api/documents/:id/access-log — jurnal de acces
router.get('/:id/access-log', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });

    const document = await prisma.documents.findUnique({ where: { id: idParse.data } });
    if (!document) return res.status(404).json({ error: 'Document negăsit' });

    const rawPage = Math.max(parseInt(req.query.page) || 1, 1);
    const rawLimit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (rawPage - 1) * rawLimit;

    const filename = document.fileUrl.split('/').pop();

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where: {
          OR: [
            { entity: 'Document', entityId: String(document.id) },
            { entity: 'File', entityId: filename },
          ],
        },
        include: {
          users: { select: { id: true, fullName: true, username: true } },
        },
        skip,
        take: rawLimit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.audit_logs.count({
        where: {
          OR: [
            { entity: 'Document', entityId: String(document.id) },
            { entity: 'File', entityId: filename },
          ],
        },
      }),
    ]);

    res.json({
      data: logs,
      pagination: { page: rawPage, limit: rawLimit, total, pages: Math.ceil(total / rawLimit) },
    });
  } catch (error) {
    console.error('Error fetching access log:', error);
    res.status(500).json({ error: 'Eroare la preluarea jurnalului de acces' });
  }
});

// POST /api/documents — upload + creare
router.post('/', upload.single('file'), antivirusMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nu s-a găsit fișier' });
    }

    const parsed = createDocSchema.safeParse(req.body);
    if (!parsed.success) {
      fs.unlink(req.file.path, (err) => { if (err) console.error('Error deleting orphaned file:', err.message); });
      return res.status(400).json({
        error: 'Date invalide',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;
    let tags = data.tags || [];
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch { tags = tags.split(',').map(t => t.trim()).filter(Boolean); }
    }
    const fileUrl = `/api/documents/file/${req.file.filename}`;
    const fileHash = await computeFileHash(req.file.path);

    const document = await prisma.$transaction(async (tx) => {
      const created = await tx.documents.create({
        data: {
          title: data.title,
          category: data.category,
          description: data.description || null,
          tags,
          deviceId: data.deviceId || null,
          version: data.version || '1.0',
          isCurrent: true,
          isDeleted: false,
          fileUrl,
          fileSize: req.file.size,
          mimeType: req.fileScanResult?.mimeType || req.file.mimetype,
          fileHash,
          issuer: data.issuer || null,
          validFrom: data.validFrom || null,
          validUntil: data.validUntil || null,
          reviewAt: data.reviewAt || null,
          uploadedById: req.user.sub,
          updatedAt: new Date(),
        },
        include: {
          uploadedBy: { select: { id: true, fullName: true, username: true } },
          device: { select: { id: true, name: true, inventoryNumber: true } },
        },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'CREATE',
          entity: 'Document',
          entityId: String(created.id),
          changes: {
            title: created.title,
            category: created.category,
            filename: req.file.originalname,
            size: req.file.size,
            mimeType: req.fileScanResult?.mimeType || req.file.mimetype,
          },
        },
      });

      return created;
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting orphaned file:', err.message);
      });
    }
    res.status(500).json({ error: 'Eroare la crearea documentului' });
  }
});

// POST /api/documents/:id/version — încărcare versiune nouă
router.post('/:id/version', upload.single('file'), antivirusMiddleware, async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'ID invalid' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nu s-a găsit fișier' });
    }

    const parent = await prisma.documents.findUnique({ where: { id: idParse.data } });
    if (!parent) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Document părinte negăsit' });
    }

    const fileUrl = `/api/documents/file/${req.file.filename}`;
    const newVersion = req.body.version || incrementVersion(parent.version);
    const fileHash = await computeFileHash(req.file.path);

    const result = await prisma.$transaction(async (tx) => {
      await tx.documents.update({
        where: { id: parent.id },
        data: { isCurrent: false },
      });

      const created = await tx.documents.create({
        data: {
          title: req.body.title || parent.title,
          category: parent.category,
          description: req.body.description || parent.description,
          tags: req.body.tags ? JSON.parse(req.body.tags) : parent.tags,
          deviceId: parent.deviceId,
          version: newVersion,
          isCurrent: true,
          isDeleted: false,
          fileUrl,
          fileSize: req.file.size,
          mimeType: req.fileScanResult?.mimeType || req.file.mimetype,
          fileHash,
          previousVersionId: parent.id,
          uploadedById: req.user.sub,
          updatedAt: new Date(),
        },
        include: {
          uploadedBy: { select: { id: true, fullName: true, username: true } },
          device: { select: { id: true, name: true, inventoryNumber: true } },
        },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'UPDATE',
          entity: 'Document',
          entityId: String(created.id),
          changes: {
            newVersion: created.version,
            previousVersionId: parent.id,
            filename: req.file.originalname,
          },
        },
      });

      return created;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating document version:', error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting orphaned file:', err.message);
      });
    }
    res.status(500).json({ error: 'Eroare la crearea versiunii' });
  }
});

// PUT /api/documents/:id — editare metadate
router.put('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });

    const parsed = updateDocSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Date invalide',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await prisma.documents.findUnique({ where: { id: idParse.data } });
    if (!existing) {
      return res.status(404).json({ error: 'Document negăsit' });
    }

    const updateData = { ...parsed.data, updatedAt: new Date() };

    const document = await prisma.$transaction(async (tx) => {
      const updated = await tx.documents.update({
        where: { id: idParse.data },
        data: updateData,
        include: {
          uploadedBy: { select: { id: true, fullName: true, username: true } },
          device: { select: { id: true, name: true, inventoryNumber: true } },
        },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'UPDATE',
          entity: 'Document',
          entityId: String(updated.id),
          changes: { before: existing, after: updated },
        },
      });

      return updated;
    });

    res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Eroare la actualizarea documentului' });
  }
});

// DELETE /api/documents/:id — soft-delete
router.delete('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });

    const existing = await prisma.documents.findUnique({ where: { id: idParse.data } });
    if (!existing) {
      return res.status(404).json({ error: 'Document negăsit' });
    }

    if (existing.isDeleted) {
      return res.status(409).json({ error: 'Documentul este deja șters' });
    }

    const document = await prisma.$transaction(async (tx) => {
      const updated = await tx.documents.update({
        where: { id: idParse.data },
        data: { isDeleted: true, updatedAt: new Date() },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'DELETE',
          entity: 'Document',
          entityId: String(updated.id),
          changes: { title: existing.title, category: existing.category },
        },
      });

      return updated;
    });

    res.json({ message: 'Document șters cu succes', document });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Eroare la ștergerea documentului' });
  }
});

// GET /api/documents/file/:filename — servire autentificată
router.get('/file/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Nume fișier invalid' });
    }

    const filePath = path.join(__dirname, '../../uploads/documents', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fișier negăsit' });
    }

    const uploadsDir = path.resolve(path.join(__dirname, '../../uploads/documents'));
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(uploadsDir)) {
      return res.status(400).json({ error: 'Acces interzis' });
    }

    await prisma.audit_logs.create({
      data: {
        userId: req.user.sub,
        action: 'FILE_ACCESS',
        entity: 'File',
        entityId: filename,
        changes: { filename, timestamp: new Date().toISOString() },
      },
    }).catch(err => console.error('Audit log error:', err.message));

    res.download(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Eroare la descărcarea fișierului' });
  }
});

function incrementVersion(version) {
  const parts = version.split('.').map(Number);
  if (parts.length === 2) {
    return `${parts[0]}.${parts[1] + 1}`;
  }
  return `${version}.1`;
}

module.exports = router;
