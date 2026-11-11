export const ALL_PERMISSION_KEYS = [
  'dashboard',
  'customers',
  'farms',
  'orders',
  'schedule',
  'analysis',
  'financial',
  'reports',
  'settings',
] as const;

export type PermissionKey = (typeof ALL_PERMISSION_KEYS)[number];

const PERMISSION_SET = new Set<string>(ALL_PERMISSION_KEYS);

export const ROLE_TO_LABEL: Record<string, string> = {
  admin: 'Administrador',
  administrador: 'Administrador',
  manager: 'Gerente',
  gerente: 'Gerente',
  operator: 'Operador de Campo',
  'operador de campo': 'Operador de Campo',
  operador: 'Operador de Campo',
  user: 'Operador de Campo',
  financial: 'Financeiro',
  financeiro: 'Financeiro',
  analyst: 'Analista',
  analista: 'Analista',
};

export const ROLE_DEFAULT_PERMISSIONS: Record<string, PermissionKey[]> = {
  Administrador: [...ALL_PERMISSION_KEYS],
  Gerente: ['dashboard', 'customers', 'farms', 'orders', 'schedule', 'analysis', 'financial', 'reports'],
  'Operador de Campo': ['dashboard', 'farms', 'orders', 'schedule'],
  Financeiro: ['dashboard', 'customers', 'orders', 'financial', 'reports'],
  Analista: ['dashboard', 'farms', 'analysis', 'reports'],
};

export const normalizeRoleLabel = (role?: string | null): string => {
  if (!role || !role.trim()) return 'Operador de Campo';
  const normalized = role.trim().toLowerCase();
  return ROLE_TO_LABEL[normalized] || role.trim();
};

export const normalizeUserStatus = (status?: string | null): 'Ativo' | 'Inativo' => {
  if (status && status.trim().toLowerCase() === 'inativo') {
    return 'Inativo';
  }
  return 'Ativo';
};

export const isAdminRole = (role?: string | null): boolean => {
  return normalizeRoleLabel(role) === 'Administrador';
};

export const sanitizePermissions = (permissions: unknown): PermissionKey[] => {
  if (!Array.isArray(permissions)) return [];
  const unique: PermissionKey[] = [];
  for (const item of permissions) {
    if (typeof item === 'string' && PERMISSION_SET.has(item) && !unique.includes(item as PermissionKey)) {
      unique.push(item as PermissionKey);
    }
  }
  return unique;
};

export const getDefaultPermissionsForRole = (role?: string | null): PermissionKey[] => {
  const label = normalizeRoleLabel(role);
  const preset = ROLE_DEFAULT_PERMISSIONS[label];
  return preset ? [...preset] : ['dashboard'];
};

export const resolveUserPermissions = (
  role?: string | null,
  permissions?: string[] | null,
): PermissionKey[] => {
  if (Array.isArray(permissions)) {
    return sanitizePermissions(permissions);
  }
  return getDefaultPermissionsForRole(role);
};

export interface SafeUserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  status: 'Ativo' | 'Inativo';
  permissions: PermissionKey[];
  avatar_url: string | null;
  password?: undefined;
  created_at?: Date;
  updated_at?: Date;
}

export const sanitizeUser = (user: any): SafeUserDTO => {
  const roleLabel = normalizeRoleLabel(user.role);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: roleLabel,
    phone: user.phone ?? null,
    status: normalizeUserStatus(user.status),
    permissions: resolveUserPermissions(user.role, user.permissions),
    avatar_url: user.avatar_url ?? null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

