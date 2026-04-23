/**
 * Portal Models - Re-exports from unified types
 * All types are now centralized in src/types/
 */

// Re-export from management types
export type {
  Desk, CreateDeskDTO, UpdateDeskDTO,
  Team, CreateTeamDTO, UpdateTeamDTO,
  TeamUser,
  User, CreateUserDTO, UpdateUserDTO,
  Role, CreateRoleDTO, UpdateRoleDTO,
  MediaUnit, CreateMediaUnitDTO, UpdateMediaUnitDTO,
  ProgramRole, CreateProgramRoleDTO, UpdateProgramRoleDTO,
} from '../../types/management';

// Re-export from content types
export type {
  Program, CreateProgramDTO, UpdateProgramDTO,
  Episode, CreateEpisodeDTO, UpdateEpisodeDTO,
  Guest, CreateGuestDTO, UpdateGuestDTO,
  EpisodeGuest, CreateEpisodeGuestDTO,
} from '../../types/content';
