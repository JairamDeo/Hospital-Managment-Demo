export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
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
    req.body = value;
    next();
  };
};
  