import { z } from 'zod';

// Schema este aliniată 1-la-1 cu câmpurile din DeviceForm.jsx.
// Câmpurile care existau în versiunea precedentă dar NU sunt în formular
// (warrantyEndDate, acquisitionValue, residualValue, maintenanceFreq, room)
// au fost redenumite/aliniate cu ce trimite efectiv formularul.

// Helper: normalizează stringuri goale și null la undefined pentru câmpuri opționale.
// Previne stockarea datelor „murdare" în baza de date medicale.
const emptyToUndef = (schema) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

export const deviceSchema = z.object({
  // ── Step 0: Identificare ────────────────────────────────────────────────────
  inventoryNumber: z
    .string()
    .min(1, 'Numărul inventarului este obligatoriu')
    .regex(/^[A-Z0-9-]+$/, 'Doar litere majuscule, cifre și liniuțe'),

  name: z
    .string()
    .min(3, 'Denumirea trebuie să aibă cel puțin 3 caractere'),

  model: emptyToUndef(z.string()),

  serialNumber: emptyToUndef(z.string()),

  manufacturer: emptyToUndef(z.string()),

  yearMade: emptyToUndef(
    z.coerce
      .number()
      .int()
      .min(1900, 'Anul trebuie să fie după 1900')
      .max(new Date().getFullYear() + 1, 'Anul nu poate fi în viitor')
  ),

  // ── Step 1: Clasificare ─────────────────────────────────────────────────────
  riskClass: z.enum(['I', 'IIa', 'IIb', 'III'], {
    errorMap: () => ({ message: 'Selectați o clasă de risc din listă' }),
  }).or(z.literal('')),

  status: z.enum(
    ['FUNCTIONAL', 'IN_REPARATIE', 'DEFECT', 'CASAT', 'IMPRUMUTAT', 'REZERVA'],
    { errorMap: () => ({ message: 'Selectați un status din listă' }) }
  ),

  sectionId: z
    .coerce
    .number()
    .int()
    .min(1, 'Selectați o secție'),

  // Câmpul din formular este `acquisitionDate` (Controller cu DatePicker)
  acquisitionDate: z
    .coerce
    .date()
    .nullable()
    .optional(),

  // Câmpul din formular este `warrantyExpiry` (Controller cu DatePicker)
  // Vechiul naam era `warrantyEndDate` — a cauzat validare silențios ruptă
  warrantyExpiry: z
    .coerce
    .date()
    .nullable()
    .optional(),

  // ── Step 2: Câmpuri avansate (opționale) ────────────────────────────────────
  location: emptyToUndef(z.string()),

  countryOfOrigin: emptyToUndef(z.string()),

  // Câmpul din formular este `purchasePrice` (input type=number, step=0.01)
  // Vechiul name era `acquisitionValue`
  purchasePrice: emptyToUndef(
    z.coerce
      .number()
      .min(0, 'Prețul trebuie să fie >= 0')
  ),

  currency: z
    .string()
    .default('MDL'),

  ceMarking: emptyToUndef(z.string()),

  cndCode: emptyToUndef(z.string()),

  // Câmpul din formular este `maintenanceSchedule` (input type=number, placeholder "Ex: 12")
  // Vechiul name era `maintenanceFreq`
  maintenanceSchedule: emptyToUndef(
    z.coerce
      .number()
      .int()
      .min(1, 'Minim 1 lună')
  ),

  notes: emptyToUndef(z.string()),
});
