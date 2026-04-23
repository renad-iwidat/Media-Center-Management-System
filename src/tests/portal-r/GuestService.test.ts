/**
 * Guest Service Tests
 * Unit tests for GuestService
 */

import { GuestService } from '../../services/portal-r';

describe('GuestService', () => {
  let guestService: GuestService;

  beforeEach(() => {
    guestService = new GuestService();
  });

  describe('getAllGuests', () => {
    it('should return an array of guests', async () => {
      const guests = await guestService.getAllGuests();
      expect(Array.isArray(guests)).toBe(true);
    });
  });

  describe('getGuestById', () => {
    it('should return null for non-existent guest', async () => {
      const guest = await guestService.getGuestById(BigInt(99999));
      expect(guest).toBeNull();
    });
  });

  describe('createGuest', () => {
    it('should create a new guest', async () => {
      const newGuest = await guestService.createGuest({
        name: 'Test Guest',
        title: 'Doctor',
        bio: 'Test Bio',
        phone: '+966501234567',
      });

      expect(newGuest).toBeDefined();
      expect(newGuest.name).toBe('Test Guest');
      expect(newGuest.title).toBe('Doctor');
      expect(newGuest.phone).toBe('+966501234567');
    });

    it('should create guest with minimal data', async () => {
      const newGuest = await guestService.createGuest({
        name: 'Minimal Guest',
      });

      expect(newGuest).toBeDefined();
      expect(newGuest.name).toBe('Minimal Guest');
    });
  });

  describe('updateGuest', () => {
    it('should update guest phone', async () => {
      const newGuest = await guestService.createGuest({
        name: 'Phone Test',
        phone: '+966501111111',
      });

      const updated = await guestService.updateGuest(newGuest.id, {
        phone: '+966502222222',
      });

      expect(updated).toBeDefined();
      expect(updated?.phone).toBe('+966502222222');
    });
  });

  describe('deleteGuest', () => {
    it('should delete a guest', async () => {
      const newGuest = await guestService.createGuest({
        name: 'Guest to Delete',
      });

      const deleted = await guestService.deleteGuest(newGuest.id);
      expect(deleted).toBe(true);

      const found = await guestService.getGuestById(newGuest.id);
      expect(found).toBeNull();
    });
  });

  describe('searchGuestsByName', () => {
    it('should search guests by name', async () => {
      const newGuest = await guestService.createGuest({
        name: 'Search Test Guest',
      });

      const results = await guestService.searchGuestsByName('Search Test');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', async () => {
      const results = await guestService.searchGuestsByName('NonExistentGuest12345');
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
