/**
 * Programs Service
 * خدمة البرامج والحلقات والضيوف
 */

import { query } from '../../config/database';

export interface Program {
  id: number;
  title: string;
  description?: string;
  media_unit_id?: number;
  created_at?: string;
}

export interface Episode {
  id: number;
  program_id: number;
  title: string;
  air_date?: string;
  created_at?: string;
  program_title?: string;
}

export interface Guest {
  id: number;
  name: string;
}

export interface EpisodeWithGuests extends Episode {
  guests: Guest[];
}

/**
 * Programs Service
 */
export class ProgramsService {
  /**
   * الحصول على جميع البرامج
   */
  static async getAll(): Promise<Program[]> {
    const result = await query(
      `SELECT p.id, p.title, p.description, p.media_unit_id, p.created_at,
              mu.name as media_unit_name
       FROM programs p
       LEFT JOIN media_units mu ON p.media_unit_id = mu.id
       ORDER BY p.title`
    );
    return result.rows;
  }

  /**
   * الحصول على برنامج بالـ ID مع حلقاته
   */
  static async getById(id: number): Promise<Program | null> {
    const result = await query(
      `SELECT p.id, p.title, p.description, p.media_unit_id, p.created_at,
              mu.name as media_unit_name
       FROM programs p
       LEFT JOIN media_units mu ON p.media_unit_id = mu.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * الحصول على حلقات برنامج معين
   */
  static async getEpisodesByProgramId(program_id: number): Promise<Episode[]> {
    const result = await query(
      `SELECT e.id, e.program_id, e.title, e.air_date, e.created_at,
              p.title as program_title
       FROM episodes e
       LEFT JOIN programs p ON e.program_id = p.id
       WHERE e.program_id = $1
       ORDER BY e.air_date DESC NULLS LAST, e.id DESC`,
      [program_id]
    );
    return result.rows;
  }

  /**
   * الحصول على حلقة بالـ ID مع ضيوفها
   */
  static async getEpisodeWithGuests(episode_id: number): Promise<EpisodeWithGuests | null> {
    const episodeResult = await query(
      `SELECT e.id, e.program_id, e.title, e.air_date, e.created_at,
              p.title as program_title, p.description as program_description
       FROM episodes e
       LEFT JOIN programs p ON e.program_id = p.id
       WHERE e.id = $1`,
      [episode_id]
    );

    if (!episodeResult.rows[0]) return null;

    const guestsResult = await query(
      `SELECT g.id, g.name
       FROM guests g
       INNER JOIN episode_guests eg ON g.id = eg.guest_id
       WHERE eg.episode_id = $1
       ORDER BY g.name`,
      [episode_id]
    );

    return {
      ...episodeResult.rows[0],
      guests: guestsResult.rows,
    };
  }
}

/**
 * Guests Service
 */
export class GuestsService {
  /**
   * الحصول على جميع الضيوف
   */
  static async getAll(): Promise<Guest[]> {
    const result = await query(
      `SELECT id, name FROM guests ORDER BY name`
    );
    return result.rows;
  }

  /**
   * الحصول على ضيف بالـ ID
   */
  static async getById(id: number): Promise<Guest | null> {
    const result = await query(
      `SELECT id, name FROM guests WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * الحصول على ضيوف حلقة معينة
   */
  static async getByEpisodeId(episode_id: number): Promise<Guest[]> {
    const result = await query(
      `SELECT g.id, g.name
       FROM guests g
       INNER JOIN episode_guests eg ON g.id = eg.guest_id
       WHERE eg.episode_id = $1
       ORDER BY g.name`,
      [episode_id]
    );
    return result.rows;
  }

  /**
   * الحصول على آخر N ضيوف (الأحدث إضافةً)
   */
  static async getRecent(limit: number = 2): Promise<Guest[]> {
    const result = await query(
      `SELECT id, name FROM guests ORDER BY id DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * البحث عن ضيوف بالاسم
   */
  static async search(term: string): Promise<Guest[]> {
    const result = await query(
      `SELECT id, name FROM guests WHERE name ILIKE $1 ORDER BY name LIMIT 20`,
      [`%${term}%`]
    );
    return result.rows;
  }
}
