/**
 * Episode Service Tests
 * Unit tests for EpisodeService
 */

import { EpisodeService } from '../../services/portal-r';
import { ProgramService } from '../../services/portal-r';

describe('EpisodeService', () => {
  let episodeService: EpisodeService;
  let programService: ProgramService;
  let testProgramId: bigint;

  beforeEach(async () => {
    episodeService = new EpisodeService();
    programService = new ProgramService();

    // Create a test program
    const program = await programService.createProgram({
      title: 'Test Program for Episodes',
    });
    testProgramId = program.id;
  });

  describe('getAllEpisodes', () => {
    it('should return an array of episodes', async () => {
      const episodes = await episodeService.getAllEpisodes();
      expect(Array.isArray(episodes)).toBe(true);
    });
  });

  describe('getEpisodeById', () => {
    it('should return null for non-existent episode', async () => {
      const episode = await episodeService.getEpisodeById(BigInt(99999));
      expect(episode).toBeNull();
    });
  });

  describe('createEpisode', () => {
    it('should create a new episode', async () => {
      const newEpisode = await episodeService.createEpisode({
        program_id: testProgramId,
        title: 'Test Episode',
        episode_number: 1,
      });

      expect(newEpisode).toBeDefined();
      expect(newEpisode.title).toBe('Test Episode');
      expect(newEpisode.episode_number).toBe(1);
      expect(newEpisode.program_id).toBe(testProgramId);
    });
  });

  describe('updateEpisode', () => {
    it('should update episode title', async () => {
      const newEpisode = await episodeService.createEpisode({
        program_id: testProgramId,
        title: 'Original Title',
        episode_number: 2,
      });

      const updated = await episodeService.updateEpisode(newEpisode.id, {
        title: 'Updated Title',
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Updated Title');
    });
  });

  describe('deleteEpisode', () => {
    it('should delete an episode', async () => {
      const newEpisode = await episodeService.createEpisode({
        program_id: testProgramId,
        title: 'Episode to Delete',
      });

      const deleted = await episodeService.deleteEpisode(newEpisode.id);
      expect(deleted).toBe(true);

      const found = await episodeService.getEpisodeById(newEpisode.id);
      expect(found).toBeNull();
    });
  });

  describe('getEpisodesByProgramId', () => {
    it('should return episodes for a program', async () => {
      await episodeService.createEpisode({
        program_id: testProgramId,
        title: 'Episode 1',
      });

      const episodes = await episodeService.getEpisodesByProgramId(testProgramId);
      expect(Array.isArray(episodes)).toBe(true);
      expect(episodes.length).toBeGreaterThan(0);
    });
  });

  describe('getEpisodeWithGuests', () => {
    it('should return episode with guests array', async () => {
      const newEpisode = await episodeService.createEpisode({
        program_id: testProgramId,
        title: 'Episode with Guests',
      });

      const episodeWithGuests = await episodeService.getEpisodeWithGuests(newEpisode.id);
      expect(episodeWithGuests).toBeDefined();
      expect(episodeWithGuests?.guests).toBeDefined();
      expect(Array.isArray(episodeWithGuests?.guests)).toBe(true);
    });
  });
});
