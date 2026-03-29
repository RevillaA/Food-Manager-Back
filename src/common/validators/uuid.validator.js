const Joi = require('joi');

const uuidSchema = Joi.string().uuid().required();

const validateUuid = (value) => {
  const { error, value: validatedValue } = uuidSchema.validate(value);

  return {
    isValid: !error,
    error,
    value: validatedValue,
  };
};

module.exports = {
  uuidSchema,
  validateUuid,
};