/**
 * Episode Guest Service
 * Handles all episode guest-related database operations
 */

import { getPool } from '../../config/database';
import { EpisodeGuest, CreateEpisodeGuestDTO, UpdateEpisodeGuestDTO } from '../../models/portal-r';

export class EpisodeGuestService {
  private pool = getPool();

  /**
   * Get all episode guests
   */
  async getAllEpisodeGuests(): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT eg.episode_id, eg.guest_id,
             g.name, g.title, g.bio, g.phone
      FROM public.episode_guests eg
      INNER JOIN public.guests g ON eg.guest_id = g.id
      ORDER BY eg.episode_id DESC, eg.guest_id DESC
    `);
    return result.rows;
  }

  /**
   * Get guests by episode
   */
  async getGuestsByEpisodeId(episodeId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT eg.episode_id, eg.guest_id,
             g.name, g.title, g.bio, g.phone
      FROM public.episode_guests eg
      INNER JOIN public.guests g ON eg.guest_id = g.id
      WHERE eg.episode_id = $1
      ORDER BY g.name
    `, [episodeId]);
    return result.rows;
  }

  /**
   * Get episodes by guest
   */
  async getEpisodesByGuestId(guestId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT eg.episode_id, eg.guest_id,
             e.title as episode_title, e.episode_number, e.air_date,
             p.title as program_title
      FROM public.episode_guests eg
      INNER JOIN public.episodes e ON eg.episode_id = e.id
      INNER JOIN public.programs p ON e.program_id = p.id
      WHERE eg.guest_id = $1
      ORDER BY e.air_date DESC
    `, [guestId]);
    return result.rows;
  }

  /**
   * Create a new episode guest
   */
  async createEpisodeGuest(data: CreateEpisodeGuestDTO): Promise<any> {
    const result = await this.pool.query(`
      INSERT INTO public.episode_guests (episode_id, guest_id)
      VALUES ($1, $2)
      RETURNING episode_id, guest_id
    `, [data.episode_id, data.guest_id]);
    return result.rows[0];
  }

  /**
   * Delete an episode guest
   */
  async deleteEpisodeGuest(episodeId: bigint, guestId: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.episode_guests
      WHERE episode_id = $1 AND guest_id = $2
    `, [episodeId, guestId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Check if guest is in episode
   */
  async guestInEpisode(episodeId: bigint, guestId: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      SELECT episode_id FROM public.episode_guests
      WHERE episode_id = $1 AND guest_id = $2
    `, [episodeId, guestId]);
    return result.rows.length > 0;
  }
}
