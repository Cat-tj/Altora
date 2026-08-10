export function isRoleAllowed(role, roles) {
  if (!role) return false;
  if (!Array.isArray(roles) || roles.length === 0) return false;
  return roles.includes(role);
}
