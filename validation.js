const joi = require("joi");

const registerValidation = (data) => {
  const schema = joi.object({
    username: joi.string().min(1).max(255).required(),
    email: joi.string().min(5).max(255).email().required(),
    password: joi.string().min(3).max(255).required(),
    fName: joi.string().min(1).max(255).required(),
    lName: joi.string().min(1).max(255).required(),
  });

  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = joi.object({
    emailOrUsername: joi.string().required(),
    password: joi.string().required(),
  });

  return schema.validate(data);
};

module.exports = { registerValidation, loginValidation };
