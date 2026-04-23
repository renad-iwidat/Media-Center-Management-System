/**
 * MediaUnit Model
 * Represents a media unit (TV, Radio, etc.)
 */

export interface MediaUnit {
  id: bigint;
  name: string;
  description?: string;
  created_at: Date;
}

export interface CreateMediaUnitDTO {
  name: string;
  description?: string;
}

export interface UpdateMediaUnitDTO {
  name?: string;
  description?: string;
}
