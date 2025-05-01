const Joi = require('joi');

/**
 * Validates the request body for the STK Push initiation endpoint.
 * @param {object} data - The request body object to validate.
 * @returns {Joi.ValidationResult} - The validation result.
 */
function validateStkPush(data) {
    const schema = Joi.object({
        // Validate the 'phone' field
        phone: Joi.string()
            .required() // The phone number is required
            // Regex to match Kenyan phone numbers starting with 07, 08, 09 or 2547, 2548, 2549
            // Adjust the regex if you need to support other formats or prefixes
            .pattern(/^0[7-9]\d{8}$|^254[7-9]\d{8}$/)
            .messages({
                'string.empty': 'Phone number is required.',
                'any.required': 'Phone number is required.',
                'string.pattern.base': 'Invalid phone number format. Please use 07xx or 2547xx format.'
            }),

        // Validate the 'amount' field
        amount: Joi.number()
            .required() // The amount is required
            .positive() // The amount must be a positive number
            .messages({
                'number.base': 'Amount must be a number.',
                'number.empty': 'Amount is required.',
                'any.required': 'Amount is required.',
                'number.positive': 'Amount must be a positive number.'
            })
    });

    // Validate the provided data against the schema
    return schema.validate(data);
}

module.exports = validateStkPush;