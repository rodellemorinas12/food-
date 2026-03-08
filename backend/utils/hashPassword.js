const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const hashPassword = (password) => {
  return bcrypt.hashSync(password, SALT_ROUNDS);
};

const comparePassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
