const validateBody = (schema) => async (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validare eșuată',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.validated = result.data;
    next();
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ error: 'Eroare la validare' });
  }
};

const validateQuery = (schema) => async (req, res, next) => {
  try {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: 'Parametri invalizi',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.validated = { ...req.validated, ...result.data };
    next();
  } catch (err) {
    console.error('Query validation error:', err);
    res.status(500).json({ error: 'Eroare la validare parametri' });
  }
};

module.exports = { validateBody, validateQuery };
