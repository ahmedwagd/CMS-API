export function formatUserResponse(user: any) {
  const permissions =
    user.role?.permissions?.map((rp) => rp.permission.name) || [];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role?.name,
    permissions,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
