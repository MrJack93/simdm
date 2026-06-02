const { z } = require('zod');

exports.consumableCreateSchema = z.object({
  name: z.string().min(3, 'Minim 3 caractere').max(255),
  quantity: z.coerce.number().int().min(0, 'Cantitate non-negativă'),
  minQuantity: z.coerce.number().int().min(0, 'Stoc minim non-negativ'),
  unit: z.string().min(1).max(50),
  expiryDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

exports.consumableUpdateSchema = exports.consumableCreateSchema.partial();
