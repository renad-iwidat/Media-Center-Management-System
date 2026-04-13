/**
 * ProgramRole Model
 * Represents the role of a user in a program
 * Examples: presenter, producer, assistant
 */

export interface ProgramRole {
  id: bigint;
  program_id: bigint;
  user_id: bigint;
  role: string; // "presenter", "producer", "assistant", etc
  created_at: Date;
}

export interface CreateProgramRoleDTO {
  program_id: bigint;
  user_id: bigint;
  role: string;
}

export interface UpdateProgramRoleDTO {
  role?: string;
}
