const jwt = require('jsonwebtoken');
const env = require('../../config/env');

const signAccessToken = (payload) => {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwt.secret);
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
};