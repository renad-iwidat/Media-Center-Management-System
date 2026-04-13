/**
 * Episode Service
 * Handles all episode-related database operations
 */

import { getPool } from '../../config/database';
import { Episode, CreateEpisodeDTO, UpdateEpisodeDTO } from '../../models/portal-r';

export class EpisodeService {
  private pool = getPool();

  /**
   * Get all episodes
   */
  async getAllEpisodes(): Promise<Episode[]> {
    const result = await this.pool.query(`
      SELECT id, program_id, title, episode_number, air_date, created_at
      FROM public.episodes
      ORDER BY air_date DESC
    `);
    return result.rows;
  }

  /**
   * Get episode by ID
   */
  async getEpisodeById(id: bigint): Promise<Episode | null> {
    const result = await this.pool.query(`
      SELECT id, program_id, title, episode_number, air_date, created_at
      FROM public.episodes
      WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get episodes by program
   */
  async getEpisodesByProgramId(programId: bigint): Promise<Episode[]> {
    const result = await this.pool.query(`
      SELECT id, program_id, title, episode_number, air_date, created_at
      FROM public.episodes
      WHERE program_id = $1
      ORDER BY episode_number DESC
    `, [programId]);
    return result.rows;
  }

  /**
   * Create a new episode
   */
  async createEpisode(data: CreateEpisodeDTO): Promise<Episode> {
    const result = await this.pool.query(`
      INSERT INTO public.episodes (program_id, title, episode_number, air_date)
      VALUES ($1, $2, $3, $4)
      RETURNING id, program_id, title, episode_number, air_date, created_at
    `, [
      data.program_id,
      data.title,
      data.episode_number || null,
      data.air_date || null,
    ]);
    return result.rows[0];
  }

  /**
   * Update an episode
   */
  async updateEpisode(id: bigint, data: UpdateEpisodeDTO): Promise<Episode | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.episode_number !== undefined) {
      updates.push(`episode_number = $${paramCount++}`);
      values.push(data.episode_number);
    }
    if (data.air_date !== undefined) {
      updates.push(`air_date = $${paramCount++}`);
      values.push(data.air_date);
    }

    if (updates.length === 0) return this.getEpisodeById(id);

    values.push(id);
    const result = await this.pool.query(`
      UPDATE public.episodes
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, program_id, title, episode_number, air_date, created_at
    `, values);

    return result.rows[0] || null;
  }

  /**
   * Delete an episode
   */
  async deleteEpisode(id: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.episodes
      WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Add guest to episode
   */
  async addGuestToEpisode(episodeId: bigint, guestId: bigint): Promise<boolean> {
    try {
      await this.pool.query(`
        INSERT INTO public.episode_guests (episode_id, guest_id)
        VALUES ($1, $2)
      `, [episodeId, guestId]);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove guest from episode
   */
  async removeGuestFromEpisode(episodeId: bigint, guestId: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.episode_guests
      WHERE episode_id = $1 AND guest_id = $2
    `, [episodeId, guestId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get episode guests
   */
  async getEpisodeGuests(episodeId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT g.id, g.name, g.title, g.bio, g.phone
      FROM public.guests g
      INNER JOIN public.episode_guests eg ON g.id = eg.guest_id
      WHERE eg.episode_id = $1
      ORDER BY g.name
    `, [episodeId]);
    return result.rows;
  }

  /**
   * Get episode with guests
   */
  async getEpisodeWithGuests(id: bigint): Promise<any> {
    const episode = await this.getEpisodeById(id);
    if (!episode) return null;

    const guests = await this.getEpisodeGuests(id);

    return {
      ...episode,
      guests,
    };
  }
}
