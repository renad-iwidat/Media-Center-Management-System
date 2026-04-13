/**
 * Program Service Tests
 * Unit tests for ProgramService
 */

import { ProgramService } from '../../services/portal-r';

describe('ProgramService', () => {
  let programService: ProgramService;

  beforeEach(() => {
    programService = new ProgramService();
  });

  describe('getAllPrograms', () => {
    it('should return an array of programs', async () => {
      const programs = await programService.getAllPrograms();
      expect(Array.isArray(programs)).toBe(true);
    });
  });

  describe('getProgramById', () => {
    it('should return null for non-existent program', async () => {
      const program = await programService.getProgramById(BigInt(99999));
      expect(program).toBeNull();
    });
  });

  describe('createProgram', () => {
    it('should create a new program', async () => {
      const newProgram = await programService.createProgram({
        title: 'Test Program',
        description: 'Test Description',
        air_time: '20:00',
      });

      expect(newProgram).toBeDefined();
      expect(newProgram.title).toBe('Test Program');
      expect(newProgram.description).toBe('Test Description');
      expect(newProgram.air_time).toMatch(/20:00/);
    });

    it('should create program with minimal data', async () => {
      const newProgram = await programService.createProgram({
        title: 'Minimal Program',
      });

      expect(newProgram).toBeDefined();
      expect(newProgram.title).toBe('Minimal Program');
    });
  });

  describe('updateProgram', () => {
    it('should update program air_time', async () => {
      const newProgram = await programService.createProgram({
        title: 'Update Test',
        air_time: '18:00',
      });

      const updated = await programService.updateProgram(newProgram.id, {
        air_time: '21:00',
      });

      expect(updated).toBeDefined();
      expect(updated?.air_time).toMatch(/21:00/);
    });

    it('should return null for non-existent program', async () => {
      const updated = await programService.updateProgram(BigInt(99999), {
        title: 'Updated',
      });

      expect(updated).toBeNull();
    });
  });

  describe('deleteProgram', () => {
    it('should delete a program', async () => {
      const newProgram = await programService.createProgram({
        title: 'Program to Delete',
      });

      const deleted = await programService.deleteProgram(newProgram.id);
      expect(deleted).toBe(true);

      const found = await programService.getProgramById(newProgram.id);
      expect(found).toBeNull();
    });
  });

  describe('getProgramWithEpisodes', () => {
    it('should return program with episodes array', async () => {
      const newProgram = await programService.createProgram({
        title: 'Program with Episodes',
      });

      const programWithEpisodes = await programService.getProgramWithEpisodes(newProgram.id);
      expect(programWithEpisodes).toBeDefined();
      expect(programWithEpisodes?.episodes).toBeDefined();
      expect(Array.isArray(programWithEpisodes?.episodes)).toBe(true);
    });
  });

  describe('getProgramWithRoles', () => {
    it('should return program with team members', async () => {
      const newProgram = await programService.createProgram({
        title: 'Program with Roles',
      });

      const programWithRoles = await programService.getProgramWithRoles(newProgram.id);
      expect(programWithRoles).toBeDefined();
      expect(programWithRoles?.team_members).toBeDefined();
      expect(Array.isArray(programWithRoles?.team_members)).toBe(true);
    });
  });
});
