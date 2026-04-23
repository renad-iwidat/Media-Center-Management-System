import { EpisodeModel } from '../../models/content/Episode';
import pool from '../../config/database';

export class EpisodeGuestService {
  async getAllEpisodeGuests(): Promise<any[]> {
    const result = await pool.query(
      `SELECT eg.episode_id, eg.guest_id, g.name, g.title, g.bio, g.phone
       FROM episode_guests eg
       INNER JOIN guests g ON eg.guest_id = g.id
       ORDER BY eg.episode_id DESC`
    );
    return result.rows;
  }

  async getGuestsByEpisodeId(episodeId: bigint): Promise<any[]> {
    const result = await pool.query(
      `SELECT eg.episode_id, eg.guest_id, g.name, g.title, g.bio, g.phone
       FROM episode_guests eg
       INNER JOIN guests g ON eg.guest_id = g.id
       WHERE eg.episode_id = $1 ORDER BY g.name`,
      [episodeId]
    );
    return result.rows;
  }

  async getEpisodesByGuestId(guestId: bigint): Promise<any[]> {
    const result = await pool.query(
      `SELECT eg.episode_id, eg.guest_id,
              e.title as episode_title, e.episode_number, e.air_date,
              p.title as program_title
       FROM episode_guests eg
       INNER JOIN episodes e ON eg.episode_id = e.id
       INNER JOIN programs p ON e.program_id = p.id
       WHERE eg.guest_id = $1 ORDER BY e.air_date DESC`,
      [guestId]
    );
    return result.rows;
  }

  async createEpisodeGuest(episodeId: bigint, guestId: bigint): Promise<any> {
    await EpisodeModel.addGuest({ episode_id: episodeId, guest_id: guestId });
    return { episode_id: episodeId, guest_id: guestId };
  }

  async deleteEpisodeGuest(episodeId: bigint, guestId: bigint): Promise<boolean> {
    return EpisodeModel.removeGuest(episodeId, guestId);
  }

  async guestInEpisode(episodeId: bigint, guestId: bigint): Promise<boolean> {
    const guests = await EpisodeModel.getGuests(episodeId);
    return guests.some(g => g.guest_id === guestId);
  }
}
