const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;

    // Check if any field is missing (required but not in body)
    const missingFields = Object.keys(fieldErrors).filter(
      (field) => !(field in req.body)
    );

    const errorMsg = missingFields.length > 0
      ? 'Câmpuri obligatorii lipsă'
      : 'Validare eșuată';

    return res.status(400).json({
      error: errorMsg,
      details: fieldErrors,
    });
  }
  req.validated = result.data;
  next();
};

module.exports = { validateBody };
