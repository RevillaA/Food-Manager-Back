const bcrypt = require('bcrypt');

const ConflictError = require('../../common/errors/conflict-error');
const NotFoundError = require('../../common/errors/not-found-error');
const BadRequestError = require('../../common/errors/bad-request-error');
const { getPagination } = require('../../common/utils/pagination.util');

const usersRepository = require('./users.repository');

const SALT_ROUNDS = 10;

const createUser = async (payload) => {
  const existingRole = await usersRepository.findRoleByName(payload.role_name);

  if (!existingRole) {
    throw new BadRequestError('Invalid role_name');
  }

  const existingUsername = await usersRepository.findUserByUsername(payload.username);
  if (existingUsername) {
    throw new ConflictError('Username is already in use');
  }

  if (payload.email) {
    const existingEmail = await usersRepository.findUserByEmail(payload.email);
    if (existingEmail) {
      throw new ConflictError('Email is already in use');
    }
  }

  const password_hash = await bcrypt.hash(payload.password, SALT_ROUNDS);

  const created = await usersRepository.createUser({
    full_name: payload.full_name,
    username: payload.username,
    email: payload.email || null,
    password_hash,
    role_id: existingRole.id,
  });

  return usersRepository.findUserById(created.id);
};

const getUsers = async (queryParams) => {
  const { page, limit, offset } = getPagination(queryParams);

  const [users, total] = await Promise.all([
    usersRepository.listUsers({ limit, offset }),
    usersRepository.countUsers(),
  ]);

  return {
    data: users,
    meta: {
      page,
      limit,
      total,
    },
  };
};

const getUserById = async (id) => {
  const user = await usersRepository.findUserById(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

const updateUser = async (id, payload) => {
  const currentUser = await usersRepository.findUserById(id);

  if (!currentUser) {
    throw new NotFoundError('User not found');
  }

  let role_id = null;

  if (payload.role_name) {
    const existingRole = await usersRepository.findRoleByName(payload.role_name);

    if (!existingRole) {
      throw new BadRequestError('Invalid role_name');
    }

    role_id = existingRole.id;
  }

  if (payload.username && payload.username !== currentUser.username) {
    const existingUsername = await usersRepository.findUserByUsername(payload.username);
    if (existingUsername) {
      throw new ConflictError('Username is already in use');
    }
  }

  if (
    payload.email &&
    payload.email !== currentUser.email
  ) {
    const existingEmail = await usersRepository.findUserByEmail(payload.email);
    if (existingEmail) {
      throw new ConflictError('Email is already in use');
    }
  }

  await usersRepository.updateUser({
    id,
    full_name: payload.full_name ?? null,
    username: payload.username ?? null,
    email: payload.email ?? null,
    role_id,
  });

  return usersRepository.findUserById(id);
};

const updateUserStatus = async (id, is_active) => {
  const currentUser = await usersRepository.findUserById(id);

  if (!currentUser) {
    throw new NotFoundError('User not found');
  }

  await usersRepository.updateUserStatus({ id, is_active });

  return usersRepository.findUserById(id);
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
};