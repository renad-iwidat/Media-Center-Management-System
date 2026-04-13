/**
 * MediaUnit Service
 * Handles all media unit-related database operations
 */

import { getPool } from '../../config/database';
import { MediaUnit, CreateMediaUnitDTO, UpdateMediaUnitDTO } from '../../models/portal-r';

export class MediaUnitService {
  private pool = getPool();

  /**
   * Get all media units
   */
  async getAllMediaUnits(): Promise<MediaUnit[]> {
    const result = await this.pool.query(`
      SELECT id, name, description, created_at
      FROM public.media_units
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  /**
   * Get media unit by ID
   */
  async getMediaUnitById(id: bigint): Promise<MediaUnit | null> {
    const result = await this.pool.query(`
      SELECT id, name, description, created_at
      FROM public.media_units
      WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new media unit
   */
  async createMediaUnit(data: CreateMediaUnitDTO): Promise<MediaUnit> {
    const result = await this.pool.query(`
      INSERT INTO public.media_units (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description, created_at
    `, [data.name, data.description || null]);
    return result.rows[0];
  }

  /**
   * Update a media unit
   */
  async updateMediaUnit(id: bigint, data: UpdateMediaUnitDTO): Promise<MediaUnit | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }

    if (updates.length === 0) return this.getMediaUnitById(id);

    values.push(id);
    const result = await this.pool.query(`
      UPDATE public.media_units
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, created_at
    `, values);

    return result.rows[0] || null;
  }

  /**
   * Delete a media unit
   */
  async deleteMediaUnit(id: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.media_units
      WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
