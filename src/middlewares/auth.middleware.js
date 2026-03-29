const UnauthorizedError = require('../common/errors/unauthorized-error');
const { verifyAccessToken } = require('../common/utils/token.util');
const usersRepository = require('../modules/users/users.repository');

const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedError('Authorization header is required');
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Invalid authorization format');
    }

    const payload = verifyAccessToken(token);

    const user = await usersRepository.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedError('User associated with token was not found');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('User is inactive');
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role_name,
      is_active: user.is_active,
    };

    next();
  } catch (error) {
    return next(
      error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError'
        ? new UnauthorizedError('Invalid or expired token')
        : error
    );
  }
};

module.exports = authMiddleware;