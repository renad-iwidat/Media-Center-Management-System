/**
 * Desk Service Tests
 * Unit tests for DeskService
 */

import { DeskService } from '../../services/portal-r';

describe('DeskService', () => {
  let deskService: DeskService;
  let testId: string;

  beforeEach(() => {
    deskService = new DeskService();
    testId = Date.now().toString();
  });

  describe('getAllDesks', () => {
    it('should return an array of desks', async () => {
      const desks = await deskService.getAllDesks();
      expect(Array.isArray(desks)).toBe(true);
    });
  });

  describe('getDeskById', () => {
    it('should return null for non-existent desk', async () => {
      const desk = await deskService.getDeskById(BigInt(99999));
      expect(desk).toBeNull();
    });
  });

  describe('createDesk', () => {
    it('should create a new desk', async () => {
      const newDesk = await deskService.createDesk({
        name: `Test Desk ${testId}`,
        description: 'Test Description',
      });

      expect(newDesk).toBeDefined();
      expect(newDesk.name).toBe(`Test Desk ${testId}`);
      expect(newDesk.description).toBe('Test Description');
    });

    it('should create desk without description', async () => {
      const newDesk = await deskService.createDesk({
        name: `Test Desk 2 ${testId}`,
      });

      expect(newDesk).toBeDefined();
      expect(newDesk.name).toBe(`Test Desk 2 ${testId}`);
    });
  });

  describe('updateDesk', () => {
    it('should update desk name', async () => {
      const newDesk = await deskService.createDesk({
        name: `Original Name ${testId}`,
      });

      const updated = await deskService.updateDesk(newDesk.id, {
        name: `Updated Name ${testId}`,
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe(`Updated Name ${testId}`);
    });

    it('should return null for non-existent desk', async () => {
      const updated = await deskService.updateDesk(BigInt(99999), {
        name: 'Updated',
      });

      expect(updated).toBeNull();
    });
  });

  describe('deleteDesk', () => {
    it('should delete a desk', async () => {
      const newDesk = await deskService.createDesk({
        name: `Desk to Delete ${testId}`,
      });

      const deleted = await deskService.deleteDesk(newDesk.id);
      expect(deleted).toBe(true);

      const found = await deskService.getDeskById(newDesk.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent desk', async () => {
      const deleted = await deskService.deleteDesk(BigInt(99999));
      expect(deleted).toBe(false);
    });
  });

  describe('getDeskWithTeams', () => {
    it('should return desk with teams array', async () => {
      const newDesk = await deskService.createDesk({
        name: `Desk with Teams ${testId}`,
      });

      const deskWithTeams = await deskService.getDeskWithTeams(newDesk.id);
      expect(deskWithTeams).toBeDefined();
      expect(deskWithTeams?.teams).toBeDefined();
      expect(Array.isArray(deskWithTeams?.teams)).toBe(true);
    });

    it('should return null for non-existent desk', async () => {
      const deskWithTeams = await deskService.getDeskWithTeams(BigInt(99999));
      expect(deskWithTeams).toBeNull();
    });
  });
});
