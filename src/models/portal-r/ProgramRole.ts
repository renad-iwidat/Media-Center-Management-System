/**
 * ProgramRole Model
 * Represents the role of a user in a program
 * Links users to programs with specific roles
 */

export interface ProgramRole {
  id: bigint;
  program_id: bigint;
  user_id: bigint;
  role_id: bigint; // FK to roles table
  created_at: Date;
  // Joined fields (from queries)
  role_name?: string;
  user_name?: string;
  program_name?: string;
}

export interface CreateProgramRoleDTO {
  program_id: bigint;
  user_id: bigint;
  role_id: bigint;
}

export interface UpdateProgramRoleDTO {
  role_id?: bigint;
}
