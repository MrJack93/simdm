const { z } = require('zod');

const VALID_STATUSES = ['FUNCTIONAL', 'IN_REPARATIE', 'DEFECT', 'CASAT', 'IMPRUMUTAT', 'REZERVA'];
const VALID_CLASSES = ['I', 'IIa', 'IIb', 'III'];
const VALID_CURRENCIES = ['MDL', 'USD', 'EUR', 'RON'];

exports.deviceCreateSchema = z.object({
  inventoryNumber: z.string().regex(/^[A-Z0-9\-]+$/, 'Doar litere majuscule, cifre și liniuțe'),
  name: z.string().min(3, 'Minim 3 caractere').max(255),
  riskClass: z.enum(VALID_CLASSES),
  sectionId: z.coerce.number().int().min(1, 'Secție validă necesară'),
  status: z.enum(VALID_STATUSES).default('FUNCTIONAL'),
  serialNumber: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  countryOfOrigin: z.string().optional().nullable(),
  yearMade: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  ceMarking: z.string().optional().nullable(),
  cndCode: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  acquisitionDate: z.coerce.date().optional().nullable(),
  warrantyEndDate: z.coerce.date().optional().nullable(),
  acquisitionValue: z.coerce.number().min(0).optional().nullable(),
  residualValue: z.coerce.number().min(0).optional().nullable(),
  currency: z.enum(VALID_CURRENCIES).default('MDL'),
  voltage: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  power: z.string().optional().nullable(),
  accessories: z.string().optional().nullable(),
  maintenanceFreq: z.coerce.number().int().min(1).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

exports.deviceUpdateSchema = exports.deviceCreateSchema.partial().omit({ inventoryNumber: true });
