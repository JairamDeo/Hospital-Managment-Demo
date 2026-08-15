export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const input = source === 'query' ? req.query : req.body;
    const { error, value } = schema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const message = error.details
        .map((detail) => detail.message.replace(/"/g, ''))
        .join('. ');
      return res.status(400).json({
        message,
        status_code: 400,
        res: null,
      });
    }
    if (source === 'query') req.query = value;
    else req.body = value;
    next();
  };
};
  