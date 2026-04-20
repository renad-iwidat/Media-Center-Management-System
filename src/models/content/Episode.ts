import pool from '../../config/database';
import { Episode, EpisodeGuest } from '../../types/content';

export class EpisodeModel {
  static async findById(id: bigint): Promise<Episode | null> {
    const result = await pool.query('SELECT * FROM episodes WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 10, offset: number = 0): Promise<Episode[]> {
    const result = await pool.query(
      'SELECT * FROM episodes ORDER BY air_date DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findByProgram(programId: bigint, limit: number = 10, offset: number = 0): Promise<Episode[]> {
    const result = await pool.query(
      'SELECT * FROM episodes WHERE program_id = $1 ORDER BY episode_number DESC LIMIT $2 OFFSET $3',
      [programId, limit, offset]
    );
    return result.rows;
  }

  static async getLastEpisodeNumber(programId: bigint): Promise<number> {
    const result = await pool.query(
      'SELECT COALESCE(MAX(episode_number), 0) as last_number FROM episodes WHERE program_id = $1',
      [programId]
    );
    return parseInt(result.rows[0].last_number);
  }

  static async create(episode: Omit<Episode, 'id' | 'created_at'>): Promise<Episode> {
    const result = await pool.query(
      `INSERT INTO episodes (program_id, title, episode_number, air_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [episode.program_id, episode.title, episode.episode_number, episode.air_date]
    );
    return result.rows[0];
  }

  static async update(id: bigint, updates: Partial<Episode>): Promise<Episode | null> {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => updates[field as keyof Episode]);
    values.push(id);

    const result = await pool.query(
      `UPDATE episodes SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM episodes WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  static async getGuests(episodeId: bigint): Promise<EpisodeGuest[]> {
    const result = await pool.query(
      'SELECT * FROM episode_guests WHERE episode_id = $1',
      [episodeId]
    );
    return result.rows;
  }

  static async addGuest(guest: Omit<EpisodeGuest, 'id'>): Promise<EpisodeGuest> {
    const result = await pool.query(
      `INSERT INTO episode_guests (episode_id, guest_id)
       VALUES ($1, $2)
       RETURNING *`,
      [guest.episode_id, guest.guest_id]
    );
    return result.rows[0];
  }

  static async removeGuest(episodeId: bigint, guestId: bigint): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM episode_guests WHERE episode_id = $1 AND guest_id = $2',
      [episodeId, guestId]
    );
    return result.rowCount! > 0;
  }
}
