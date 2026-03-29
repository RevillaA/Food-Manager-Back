const usersRepository = require('../users/users.repository');

const findUserForLogin = async (username) => {
  return usersRepository.findUserWithPasswordByUsername(username);
};

const findAuthenticatedUserById = async (id) => {
  return usersRepository.findUserById(id);
};

module.exports = {
  findUserForLogin,
  findAuthenticatedUserById,
};