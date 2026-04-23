import { DeskModel, TeamModel } from '../../models/management/Desk';
import { Desk, CreateDeskDTO, UpdateDeskDTO } from '../../types/management';
import pool from '../../config/database';

export class DeskService {
  async getAllDesks(): Promise<any[]> {
    const result = await pool.query(
      `SELECT d.*, u.name as manager_name
       FROM desks d LEFT JOIN users u ON d.manager_id = u.id
       ORDER BY d.created_at DESC`
    );
    return result.rows;
  }

  async getDeskById(id: bigint): Promise<any> {
    const result = await pool.query(
      `SELECT d.*, u.name as manager_name
       FROM desks d LEFT JOIN users u ON d.manager_id = u.id
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async createDesk(data: CreateDeskDTO): Promise<Desk> {
    return DeskModel.create(data);
  }

  async updateDesk(id: bigint, data: UpdateDeskDTO): Promise<Desk | null> {
    return DeskModel.update(id, data as Partial<Desk>);
  }

  async deleteDesk(id: bigint): Promise<boolean> {
    return DeskModel.delete(id);
  }

  async getDeskWithTeams(id: bigint): Promise<any> {
    const desk = await this.getDeskById(id);
    if (!desk) return null;
    const teams = await DeskModel.getTeams(id);
    return { ...desk, teams };
  }
}
