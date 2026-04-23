import { EpisodeModel } from '../../models/content/Episode';
import { Episode, CreateEpisodeDTO, UpdateEpisodeDTO } from '../../types/content';
import pool from '../../config/database';

export class EpisodeService {
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
}
