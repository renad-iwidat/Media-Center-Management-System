/**
 * User Model
 * Represents an employee in the system
 */

export interface User {
  id: bigint;
  name: string;
  email: string;
  role_id?: bigint;
  work_days?: string; // "Saturday,Sunday,Monday"
  start_time?: string; // "09:00"
  end_time?: string; // "17:00"
  created_at: Date;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  role_id?: bigint;
  work_days?: string;
  start_time?: string;
  end_time?: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  role_id?: bigint;
  work_days?: string;
  start_time?: string;
  end_time?: string;
}
