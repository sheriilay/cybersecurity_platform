const Joi = require('joi');

const schemas = {
  securityData: Joi.object({
    target: Joi.string().required(),
    context: Joi.string().required(),
    data: Joi.object().required()
  }),

  complianceData: Joi.object({
    data: Joi.object().required(),
    framework: Joi.string().required()
  }),

  riskData: Joi.object({
    data: Joi.object().required(),
    context: Joi.string().optional()
  }),

  anomalyData: Joi.object({
    data: Joi.array().items(Joi.object()).required(),
    context: Joi.string().optional()
  })
};

function validateInput(data, type = 'securityData') {
  try {
    const schema = schemas[type];
    if (!schema) {
      throw new Error(`Unknown validation type: ${type}`);
    }

    const { error } = schema.validate(data, { abortEarly: false });
    if (error) {
      console.error('Validation error:', error.details);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

module.exports = {
  validateInput,
  schemas
}; 