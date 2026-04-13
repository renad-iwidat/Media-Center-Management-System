/**
 * Team Model
 * Represents a team within a desk
 */

export interface Team {
  id: bigint;
  desk_id: bigint;
  name: string;
  manager_id?: bigint;
  created_at: Date;
}

export interface CreateTeamDTO {
  desk_id: bigint;
  name: string;
  manager_id?: bigint;
}

export interface UpdateTeamDTO {
  name?: string;
  manager_id?: bigint;
}
