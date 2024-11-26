const Joi = require('joi');

const stk_input_schema = Joi.object({
    phoneNumber: Joi.string().length(10).trim().required(),
})

exports.stk_input_schema = stk_input_schema