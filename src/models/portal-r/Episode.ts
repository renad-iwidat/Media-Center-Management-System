/**
 * Episode Model
 * Represents an episode of a program
 */

export interface Episode {
  id: bigint;
  program_id: bigint;
  title: string;
  episode_number?: number;
  air_date?: Date;
  created_at: Date;
}

export interface CreateEpisodeDTO {
  program_id: bigint;
  title: string;
  episode_number?: number;
  air_date?: Date;
}

export interface UpdateEpisodeDTO {
  title?: string;
  episode_number?: number;
  air_date?: Date;
}
