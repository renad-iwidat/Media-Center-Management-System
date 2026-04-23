/**
 * Guest Service
 * Handles all guest-related database operations
 */

import { getPool } from '../../config/database';
import { Guest, CreateGuestDTO, UpdateGuestDTO } from '../../models/portal-r';

export class GuestService {
  private pool = getPool();

  /**
   * Get all guests
   */
  async getAllGuests(): Promise<Guest[]> {
    const result = await this.pool.query(`
      SELECT id, name, title, bio, phone, created_at
      FROM public.guests
      ORDER BY name
    `);
    return result.rows;
  }

  /**
   * Get guest by ID
   */
  async getGuestById(id: bigint): Promise<Guest | null> {
    const result = await this.pool.query(`
      SELECT id, name, title, bio, phone, created_at
      FROM public.guests
      WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new guest
   */
  async createGuest(data: CreateGuestDTO): Promise<Guest> {
    const result = await this.pool.query(`
      INSERT INTO public.guests (name, title, bio, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, title, bio, phone, created_at
    `, [data.name, data.title || null, data.bio || null, data.phone || null]);
    return result.rows[0];
  }

  /**
   * Update a guest
   */
  async updateGuest(id: bigint, data: UpdateGuestDTO): Promise<Guest | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(data.bio);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }

    if (updates.length === 0) return this.getGuestById(id);

    values.push(id);
    const result = await this.pool.query(`
      UPDATE public.guests
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, title, bio, phone, created_at
    `, values);

    return result.rows[0] || null;
  }

  /**
   * Delete a guest
   */
  async deleteGuest(id: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.guests
      WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Search guests by name
   */
  async searchGuestsByName(name: string): Promise<Guest[]> {
    const result = await this.pool.query(`
      SELECT id, name, title, bio, phone, created_at
      FROM public.guests
      WHERE name ILIKE $1
      ORDER BY name
    `, [`%${name}%`]);
    return result.rows;
  }
}
