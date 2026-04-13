/**
 * Desk Model
 * Represents a desk (department) in the media center
 * Examples: Ideas, Production, Publishing & Editing
 */

export interface Desk {
  id: bigint;
  name: string;
  description?: string;
  manager_id?: bigint;
  created_at: Date;
}

export interface CreateDeskDTO {
  name: string;
  description?: string;
  manager_id?: bigint;
}

export interface UpdateDeskDTO {
  name?: string;
  description?: string;
  manager_id?: bigint;
}
