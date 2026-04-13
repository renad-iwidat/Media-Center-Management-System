/**
 * Program Model
 * Represents a TV/Radio program
 */

export interface Program {
  id: bigint;
  title: string;
  description?: string;
  media_unit_id?: bigint;
  media_unit_name?: string;
  air_time?: string; // "20:00"
  created_at: Date;
}

export interface CreateProgramDTO {
  title: string;
  description?: string;
  media_unit_id?: bigint;
  air_time?: string;
}

export interface UpdateProgramDTO {
  title?: string;
  description?: string;
  media_unit_id?: bigint;
  air_time?: string;
}
