const fs = require('fs');
const path = require('path');
const { fileTypeFromFile } = require('file-type');

// Safe MIME types for medical documents
const SAFE_MIME_TYPES = [
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

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate file type using magic bytes (file signatures)
 * More secure than MIME type alone (prevents disguised malware)
 */
async function validateFileType(filePath, originalMimetype) {
  try {
    const detectedType = await fileTypeFromFile(filePath);

    if (!detectedType) {
      // If we can't detect, check MIME type only
      if (!SAFE_MIME_TYPES.includes(originalMimetype)) {
        throw new Error('Tip fișier nesuportat (nu s-a putut detecta)');
      }
      return { valid: true, detected: 'unknown', original: originalMimetype };
    }

    // Check if detected MIME is in safe list
    if (!SAFE_MIME_TYPES.includes(detectedType.mime)) {
      throw new Error(`Tip fișier detectat nesuportat: ${detectedType.mime}`);
    }

    // Log mismatch between original and detected MIME
    if (detectedType.mime !== originalMimetype) {
      console.warn(
        `⚠️ MIME mismatch: original=${originalMimetype}, detected=${detectedType.mime}`,
      );
    }

    return { valid: true, detected: detectedType.mime, original: originalMimetype };
  } catch (error) {
    throw new Error(`Eroare la validarea tip fișier: ${error.message}`);
  }
}

/**
 * Optional: Scan file with ClamAV if service is available
 * Production: ClamAV should be running on localhost:3310
 * Development: Falls back to type validation only
 */
async function scanWithClamAV(filePath) {
  if (process.env.CLAMAV_ENABLED !== 'true') {
    // ClamAV not enabled, skip scan
    return { scanned: false, infected: false, reason: 'ClamAV not enabled' };
  }

  try {
    const NodeClam = require('clamscan');
    const clamscan = await new NodeClam().init({
      host: process.env.CLAMAV_HOST || 'localhost',
      port: parseInt(process.env.CLAMAV_PORT || 3310),
      timeout: 5000,
    });

    const { isInfected, viruses } = await clamscan.scanFile(filePath);

    if (isInfected) {
      console.error(`🚨 MALWARE DETECTED: ${viruses.join(', ')}`);
      return { scanned: true, infected: true, viruses };
    }

    return { scanned: true, infected: false, viruses: [] };
  } catch (error) {
    // ClamAV not available - log but don't fail
    console.warn(
      `⚠️ ClamAV scan unavailable (production should have this): ${error.message}`,
    );
    return { scanned: false, infected: false, reason: error.message };
  }
}

/**
 * Middleware: Scan uploaded file for threats
 * Usage: router.post('/:id/upload', antivirusMiddleware, uploadHandler)
 */
async function antivirusMiddleware(req, res, next) {
  if (!req.file) {
    return next(); // No file uploaded
  }

  const filePath = req.file.path;
  const fileSize = req.file.size;

  try {
    // 1. Check file size
    if (fileSize > MAX_FILE_SIZE) {
      fs.unlinkSync(filePath); // Delete file
      return res.status(400).json({
        error: `Fișierul este prea mare (max ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB)`,
      });
    }

    // 2. Validate file type by magic bytes
    const typeValidation = await validateFileType(filePath, req.file.mimetype);
    console.log(`✅ File type validated: ${typeValidation.detected}`);

    // 3. Optional: Scan with ClamAV
    const clamavResult = await scanWithClamAV(filePath);

    if (clamavResult.infected) {
      fs.unlinkSync(filePath); // Delete infected file
      return res.status(400).json({
        error: `Fișier infectat detectat: ${clamavResult.viruses.join(', ')}`,
      });
    }

    // 4. Log scan result
    req.fileScanResult = {
      fileSize,
      mimeType: typeValidation.detected,
      clamavScanned: clamavResult.scanned,
      timestamp: new Date().toISOString(),
    };

    next();
  } catch (error) {
    // File validation failed
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Clean up
    }
    res.status(400).json({ error: error.message });
  }
}

module.exports = { antivirusMiddleware, validateFileType, scanWithClamAV };
