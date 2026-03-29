const toAuthenticatedUserResponse = (user) => {
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
  };
};

const toLoginResponse = ({ user, token }) => {
  return {
    token,
    user: toAuthenticatedUserResponse(user),
  };
};

module.exports = {
  toAuthenticatedUserResponse,
  toLoginResponse,
};