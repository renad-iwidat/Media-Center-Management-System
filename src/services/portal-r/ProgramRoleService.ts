import { ProgramRoleModel } from '../../models/management/ProgramRole';
import { ProgramRole, CreateProgramRoleDTO, UpdateProgramRoleDTO } from '../../types/management';

export class ProgramRoleService {
  async getAllProgramRoles(): Promise<ProgramRole[]> {
    return ProgramRoleModel.findAll();
  }

  async getProgramRoleById(id: bigint): Promise<ProgramRole | null> {
    return ProgramRoleModel.findById(id);
  }

  async getRolesByProgramId(programId: bigint): Promise<ProgramRole[]> {
    return ProgramRoleModel.findByProgram(programId);
  }

  async getRolesByUserId(userId: bigint): Promise<ProgramRole[]> {
    return ProgramRoleModel.findByUser(userId);
  }

  async createProgramRole(data: CreateProgramRoleDTO): Promise<ProgramRole> {
    return ProgramRoleModel.create(data);
  }

  async updateProgramRole(id: bigint, data: UpdateProgramRoleDTO): Promise<ProgramRole | null> {
    return ProgramRoleModel.update(id, data);
  }

  async deleteProgramRole(id: bigint): Promise<boolean> {
    return ProgramRoleModel.delete(id);
  }

  async userHasRoleInProgram(programId: bigint, userId: bigint, roleId: bigint): Promise<boolean> {
    return ProgramRoleModel.exists(programId, userId, roleId);
  }

  async getUsersByProgramAndRole(programId: bigint, roleId: bigint): Promise<any[]> {
    return ProgramRoleModel.findByProgramAndRole(programId, roleId);
  }
}
