const BadRequestError = require('../common/errors/bad-request-error');

const validateMiddleware = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(
        new BadRequestError('Validation error', {
          fields: error.details.map((detail) => ({
            message: detail.message,
            path: detail.path,
          })),
        })
      );
    }

    req[property] = value;
    next();
  };
};

module.exports = validateMiddleware;