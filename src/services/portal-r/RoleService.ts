import { RoleModel } from '../../models/management/Role';
import { Role, CreateRoleDTO, UpdateRoleDTO } from '../../types/management';

export class RoleService {
  async getAllRoles(): Promise<Role[]> {
    return RoleModel.findAll();
  }

  async getRoleById(id: bigint): Promise<Role | null> {
    return RoleModel.findById(id);
  }

  async createRole(data: CreateRoleDTO): Promise<Role> {
    return RoleModel.create(data);
  }

  async updateRole(id: bigint, data: UpdateRoleDTO): Promise<Role | null> {
    return RoleModel.update(id, data);
  }

  async deleteRole(id: bigint): Promise<boolean> {
    return RoleModel.delete(id);
  }
}
