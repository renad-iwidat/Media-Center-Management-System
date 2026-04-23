import { UserModel } from '../../models/management/User';
import { User, CreateUserDTO, UpdateUserDTO } from '../../types/management';

export class UserService {
  async getAllUsers(): Promise<any[]> {
    return UserModel.findAllWithRoles();
  }

  async getUserById(id: bigint): Promise<User | null> {
    return UserModel.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return UserModel.findByEmail(email);
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    return UserModel.create(data);
  }

  async updateUser(id: bigint, data: UpdateUserDTO): Promise<User | null> {
    return UserModel.update(id, data as Partial<User>);
  }

  async deleteUser(id: bigint): Promise<boolean> {
    return UserModel.delete(id);
  }

  async getUsersByTeamId(teamId: bigint): Promise<User[]> {
    return UserModel.findByTeam(teamId);
  }

  async getUserWithRole(id: bigint): Promise<any> {
    return UserModel.findWithRole(id);
  }
}
