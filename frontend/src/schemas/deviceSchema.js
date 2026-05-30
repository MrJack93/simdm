import { z } from 'zod';

export const deviceSchema = z.object({
  inventoryNumber: z
    .string()
    .min(1, 'Numărul inventarului este obligatoriu')
    .regex(/^[A-Z0-9\-]+$/, 'Doar litere majuscule, cifre și liniuțe'),

  name: z
    .string()
    .min(3, 'Denumirea trebuie să aibă cel puțin 3 caractere'),

  serialNumber: z
    .string()
    .optional()
    .or(z.literal('')),

  model: z
    .string()
    .optional()
    .or(z.literal('')),

  manufacturer: z
    .string()
    .optional()
    .or(z.literal('')),

  countryOfOrigin: z
    .string()
    .optional()
    .or(z.literal('')),

  yearMade: z
    .coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional()
    .or(z.literal('')),

  riskClass: z.enum(['I', 'IIa', 'IIb', 'III'], {
    errorMap: () => ({ message: 'Clasa de risc invalid' }),
  }),

  ceMarking: z
    .string()
    .optional()
    .or(z.literal('')),

  cndCode: z
    .string()
    .optional()
    .or(z.literal('')),

  status: z.enum(
    ['FUNCTIONAL', 'IN_REPARATIE', 'DEFECT', 'CASAT', 'IMPRUMUTAT', 'REZERVA'],
    { errorMap: () => ({ message: 'Status invalid' }) }
  ),

  sectionId: z
    .coerce
    .number()
    .int()
    .min(1, 'Selectați o secție'),

  room: z
    .string()
    .optional()
    .or(z.literal('')),

  acquisitionDate: z
    .coerce
    .date()
    .nullable()
    .optional(),

  warrantyEndDate: z
    .coerce
    .date()
    .nullable()
    .optional(),

  acquisitionValue: z
    .coerce
    .number()
    .min(0, 'Valoarea trebuie să fie >= 0')
    .optional()
    .or(z.literal('')),

  residualValue: z
    .coerce
    .number()
    .min(0, 'Valoarea trebuie să fie >= 0')
    .optional()
    .or(z.literal('')),

  currency: z
    .string()
    .default('MDL'),

  voltage: z
    .string()
    .optional()
    .or(z.literal('')),

  frequency: z
    .string()
    .optional()
    .or(z.literal('')),

  power: z
    .string()
    .optional()
    .or(z.literal('')),

  accessories: z
    .string()
    .optional()
    .or(z.literal('')),

  maintenanceFreq: z
    .coerce
    .number()
    .int()
    .min(1)
    .optional()
    .or(z.literal('')),

  notes: z
    .string()
    .optional()
    .or(z.literal('')),
});
