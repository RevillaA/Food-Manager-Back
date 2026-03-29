const toUserResponse = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    email: user.email,
    is_active: user.is_active,
    role: {
      id: user.role_id,
      name: user.role_name,
      description: user.role_description || null,
    },
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

const toUsersListResponse = (users = []) => {
  return users.map(toUserResponse);
};

module.exports = {
  toUserResponse,
  toUsersListResponse,
};