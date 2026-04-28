export const userRoles = ["admin", "operator", "owner", "housekeeping", "maintenance"] as const;

export type UserRole = (typeof userRoles)[number];

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  operator: "Operaciones",
  owner: "Propietario",
  housekeeping: "Limpieza",
  maintenance: "Mantenimiento"
};
