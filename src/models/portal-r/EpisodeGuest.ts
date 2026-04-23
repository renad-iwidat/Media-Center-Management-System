/**
 * Episode Guest Model
 * Represents a guest appearing in an episode
 */

export interface EpisodeGuest {
  id: bigint;
  episode_id: bigint;
  guest_id: bigint;
  created_at: Date;
}

export interface CreateEpisodeGuestDTO {
  episode_id: bigint;
  guest_id: bigint;
}

export interface UpdateEpisodeGuestDTO {
  guest_id?: bigint;
}
