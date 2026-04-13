/**
 * User Service Tests
 * Unit tests for UserService
 */

import { UserService } from '../../services/portal-r';

describe('UserService', () => {
  let userService: UserService;
  let testId: string;

  beforeEach(() => {
    userService = new UserService();
    testId = Date.now().toString();
  });

  describe('getAllUsers', () => {
    it('should return an array of users', async () => {
      const users = await userService.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('getUserById', () => {
    it('should return null for non-existent user', async () => {
      const user = await userService.getUserById(BigInt(99999));
      expect(user).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const newUser = await userService.createUser({
        name: 'Test User',
        email: `test${testId}@example.com`,
        work_days: 'Saturday,Sunday,Monday',
        start_time: '09:00',
        end_time: '17:00',
      });

      expect(newUser).toBeDefined();
      expect(newUser.name).toBe('Test User');
      expect(newUser.email).toBe(`test${testId}@example.com`);
      expect(newUser.work_days).toBe('Saturday,Sunday,Monday');
    });

    it('should create user with minimal data', async () => {
      const newUser = await userService.createUser({
        name: 'Minimal User',
        email: `minimal${testId}@example.com`,
      });

      expect(newUser).toBeDefined();
      expect(newUser.name).toBe('Minimal User');
      expect(newUser.email).toBe(`minimal${testId}@example.com`);
    });
  });

  describe('getUserByEmail', () => {
    it('should find user by email', async () => {
      const newUser = await userService.createUser({
        name: 'Email Test',
        email: `emailtest${testId}@example.com`,
      });

      const found = await userService.getUserByEmail(`emailtest${testId}@example.com`);
      expect(found).toBeDefined();
      expect(found?.id).toBe(newUser.id);
    });

    it('should return null for non-existent email', async () => {
      const found = await userService.getUserByEmail(`nonexistent${testId}@example.com`);
      expect(found).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user schedule', async () => {
      const newUser = await userService.createUser({
        name: 'Schedule Test',
        email: `schedule${testId}@example.com`,
      });

      const updated = await userService.updateUser(newUser.id, {
        work_days: 'Monday,Tuesday,Wednesday',
        start_time: '08:00',
        end_time: '16:00',
      });

      expect(updated).toBeDefined();
      expect(updated?.work_days).toBe('Monday,Tuesday,Wednesday');
      expect(updated?.start_time).toMatch(/08:00/);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const newUser = await userService.createUser({
        name: 'User to Delete',
        email: `delete${testId}@example.com`,
      });

      const deleted = await userService.deleteUser(newUser.id);
      expect(deleted).toBe(true);

      const found = await userService.getUserById(newUser.id);
      expect(found).toBeNull();
    });
  });

  describe('getUserWithRole', () => {
    it('should return user with role details', async () => {
      const newUser = await userService.createUser({
        name: 'Role Test',
        email: `role${testId}@example.com`,
      });

      const userWithRole = await userService.getUserWithRole(newUser.id);
      expect(userWithRole).toBeDefined();
      expect(userWithRole?.name).toBe('Role Test');
    });
  });
});
