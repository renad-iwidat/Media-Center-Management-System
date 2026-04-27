import { EpisodeModel } from '../../models/content/Episode';
import { Episode, CreateEpisodeDTO, UpdateEpisodeDTO } from '../../types/content';
import pool from '../../config/database';

export class EpisodeService {

  // ============ CRUD ============

  async getAllEpisodes(): Promise<Episode[]> {
    return EpisodeModel.findAll();
  }

  async getEpisodeById(id: bigint): Promise<Episode | null> {
    return EpisodeModel.findById(id);
  }

  async getEpisodesByProgramId(programId: bigint): Promise<Episode[]> {
    return EpisodeModel.findByProgram(programId);
  }

  async createEpisode(data: CreateEpisodeDTO): Promise<Episode> {
    return EpisodeModel.create(data);
  }

  async updateEpisode(id: bigint, data: UpdateEpisodeDTO): Promise<Episode | null> {
    return EpisodeModel.update(id, data as Partial<Episode>);
  }

  async deleteEpisode(id: bigint): Promise<boolean> {
    return EpisodeModel.delete(id);
  }

  // ============ Guests ============

  async addGuestToEpisode(episodeId: bigint, guestId: bigint): Promise<boolean> {
    try {
      await EpisodeModel.addGuest({ episode_id: episodeId, guest_id: guestId });
      return true;
    } catch {
      return false;
    }
  }

  async removeGuestFromEpisode(episodeId: bigint, guestId: bigint): Promise<boolean> {
    return EpisodeModel.removeGuest(episodeId, guestId);
  }

  async getEpisodeGuests(episodeId: bigint): Promise<any[]> {
    const result = await pool.query(
      `SELECT g.* FROM guests g
       INNER JOIN episode_guests eg ON g.id = eg.guest_id
       WHERE eg.episode_id = $1 ORDER BY g.name`,
      [episodeId]
    );
    return result.rows;
  }

  async getEpisodeWithGuests(id: bigint): Promise<any> {
    const episode = await this.getEpisodeById(id);
    if (!episode) return null;
    const guests = await this.getEpisodeGuests(id);
    return { ...episode, guests };
  }

  // ============ Enriched Views ============

  /**
   * Get episode with full context — single optimized query
   * Returns: episode + program name + order status + guests count + content count
   */
  async getEpisodeEnriched(id: bigint): Promise<any> {
    const result = await pool.query(
      `SELECT
         e.id, e.program_id, e.title, e.episode_number, e.air_date, e.created_at,
         p.title as program_name,
         p.air_time as program_air_time,
         o.id as order_id,
         o.status_id as order_status_id,
         os.name as status,
         o.deadline as order_deadline,
         o.created_by as order_created_by,
         (SELECT COUNT(*) FROM episode_guests eg WHERE eg.episode_id = e.id) as guests_count,
         (SELECT COUNT(*) FROM content c
          WHERE c.task_id IN (SELECT t.id FROM tasks t WHERE t.order_id = o.id)
         ) as content_count
       FROM episodes e
       INNER JOIN programs p ON e.program_id = p.id
       LEFT JOIN orders o ON o.episode_id = e.id
       LEFT JOIN order_statuses os ON o.status_id = os.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      program_id: row.program_id,
      program_name: row.program_name,
      title: row.title,
      episode_number: row.episode_number,
      air_date: row.air_date,
      created_at: row.created_at,
      status: row.status || 'draft',
      order_id: row.order_id || null,
      order_deadline: row.order_deadline || null,
      guests_count: parseInt(row.guests_count) || 0,
      content_count: parseInt(row.content_count) || 0,
    };
  }

  /**
   * Get all episodes enriched — batch optimized query
   */
  async getAllEpisodesEnriched(limit: number = 50, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         e.id, e.program_id, e.title, e.episode_number, e.air_date, e.created_at,
         p.title as program_name,
         o.id as order_id,
         os.name as status,
         o.deadline as order_deadline,
         (SELECT COUNT(*) FROM episode_guests eg WHERE eg.episode_id = e.id) as guests_count,
         (SELECT COUNT(*) FROM content c
          WHERE c.task_id IN (SELECT t.id FROM tasks t WHERE t.order_id = o.id)
         ) as content_count
       FROM episodes e
       INNER JOIN programs p ON e.program_id = p.id
       LEFT JOIN orders o ON o.episode_id = e.id
       LEFT JOIN order_statuses os ON o.status_id = os.id
       ORDER BY e.air_date DESC NULLS LAST
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map(row => ({
      id: row.id,
      program_id: row.program_id,
      program_name: row.program_name,
      title: row.title,
      episode_number: row.episode_number,
      air_date: row.air_date,
      created_at: row.created_at,
      status: row.status || 'draft',
      order_id: row.order_id || null,
      order_deadline: row.order_deadline || null,
      guests_count: parseInt(row.guests_count) || 0,
      content_count: parseInt(row.content_count) || 0,
    }));
  }

  /**
   * Get episode full details — episode + guests + order + tasks + content
   */
  async getEpisodeFull(id: bigint): Promise<any> {
    const enriched = await this.getEpisodeEnriched(id);
    if (!enriched) return null;

    // Get guests (single query)
    const guests = await this.getEpisodeGuests(id);

    // Get tasks and content if order exists
    let tasks: any[] = [];
    let content: any[] = [];

    if (enriched.order_id) {
      const tasksResult = await pool.query(
        `SELECT t.*, ts.name as status_name, u.name as assigned_to_name
         FROM tasks t
         LEFT JOIN task_statuses ts ON t.status_id = ts.id
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.order_id = $1
         ORDER BY t.sequence_order ASC`,
        [enriched.order_id]
      );
      tasks = tasksResult.rows;

      const contentResult = await pool.query(
        `SELECT c.*, ct.name as type_name
         FROM content c
         LEFT JOIN content_types ct ON c.content_type_id = ct.id
         WHERE c.task_id IN (SELECT t.id FROM tasks t WHERE t.order_id = $1)
         ORDER BY c.created_at DESC`,
        [enriched.order_id]
      );
      content = contentResult.rows;
    }

    return {
      ...enriched,
      guests,
      tasks,
      content,
    };
  }
}
