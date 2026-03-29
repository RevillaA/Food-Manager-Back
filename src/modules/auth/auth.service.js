const bcrypt = require('bcrypt');

const UnauthorizedError = require('../../common/errors/unauthorized-error');
const { signAccessToken } = require('../../common/utils/token.util');

const authRepository = require('./auth.repository');

const login = async ({ username, password }) => {
  const user = await authRepository.findUserForLogin(username);

  if (!user) {
    throw new UnauthorizedError('Invalid username or password');
  }

  if (!user.is_active) {
    throw new UnauthorizedError('User is inactive');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid username or password');
  }

  const token = signAccessToken({
    sub: user.id,
    username: user.username,
    role: user.role_name,
  });

  return {
    token,
    user,
  };
};

const getAuthenticatedUser = async (userId) => {
  const user = await authRepository.findAuthenticatedUserById(userId);

  if (!user) {
    throw new UnauthorizedError('Invalid token user');
  }

  if (!user.is_active) {
    throw new UnauthorizedError('User is inactive');
  }

  return user;
};

module.exports = {
  login,
  getAuthenticatedUser,
};