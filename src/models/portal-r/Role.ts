/**
 * Role Model
 * Represents a user role
 */

export interface Role {
  id: bigint;
  name: string;
  description?: string;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
}
