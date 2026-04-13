import client from './client';

// Desks
export const deskAPI = {
  getAll: () => client.get('/desks'),
  getById: (id: string) => client.get(`/desks/${id}`),
  create: (data: any) => client.post('/desks', data),
  update: (id: string, data: any) => client.put(`/desks/${id}`, data),
  delete: (id: string) => client.delete(`/desks/${id}`),
};

// Teams
export const teamAPI = {
  getAll: () => client.get('/teams'),
  getById: (id: string) => client.get(`/teams/${id}`),
  getByDesk: (deskId: string) => client.get(`/teams?desk_id=${deskId}`),
  create: (data: any) => client.post('/teams', data),
  update: (id: string, data: any) => client.put(`/teams/${id}`, data),
  delete: (id: string) => client.delete(`/teams/${id}`),
};

// Users
export const userAPI = {
  getAll: () => client.get('/users'),
  getById: (id: string) => client.get(`/users/${id}`),
  create: (data: any) => client.post('/users', data),
  update: (id: string, data: any) => client.put(`/users/${id}`, data),
  delete: (id: string) => client.delete(`/users/${id}`),
};

// Roles
export const roleAPI = {
  getAll: () => client.get('/roles'),
  getById: (id: string) => client.get(`/roles/${id}`),
  create: (data: any) => client.post('/roles', data),
  update: (id: string, data: any) => client.put(`/roles/${id}`, data),
  delete: (id: string) => client.delete(`/roles/${id}`),
};

// Programs
export const programAPI = {
  getAll: () => client.get('/programs'),
  getById: (id: string) => client.get(`/programs/${id}`),
  create: (data: any) => client.post('/programs', data),
  update: (id: string, data: any) => client.put(`/programs/${id}`, data),
  delete: (id: string) => client.delete(`/programs/${id}`),
};

// Episodes
export const episodeAPI = {
  getAll: () => client.get('/episodes'),
  getById: (id: string) => client.get(`/episodes/${id}`),
  getByProgram: (programId: string) => client.get(`/episodes?program_id=${programId}`),
  create: (data: any) => client.post('/episodes', data),
  update: (id: string, data: any) => client.put(`/episodes/${id}`, data),
  delete: (id: string) => client.delete(`/episodes/${id}`),
};

// Guests
export const guestAPI = {
  getAll: () => client.get('/guests'),
  getById: (id: string) => client.get(`/guests/${id}`),
  create: (data: any) => client.post('/guests', data),
  update: (id: string, data: any) => client.put(`/guests/${id}`, data),
  delete: (id: string) => client.delete(`/guests/${id}`),
  search: (name: string) => client.get(`/guests/search?name=${name}`),
};

// Program Roles
export const programRoleAPI = {
  getAll: () => client.get('/program-roles'),
  getById: (id: string) => client.get(`/program-roles/${id}`),
  getByProgram: (programId: string) => client.get(`/program-roles?program_id=${programId}`),
  getByUser: (userId: string) => client.get(`/program-roles?user_id=${userId}`),
  create: (data: any) => client.post('/program-roles', data),
  update: (id: string, data: any) => client.put(`/program-roles/${id}`, data),
  delete: (id: string) => client.delete(`/program-roles/${id}`),
};

// Team Users
export const teamUserAPI = {
  getByTeam: (teamId: string) => client.get(`/team-users?team_id=${teamId}`),
  getByUser: (userId: string) => client.get(`/team-users?user_id=${userId}`),
  create: (data: any) => client.post('/team-users', data),
  delete: (teamId: string, userId: string) => client.delete(`/team-users/${teamId}/${userId}`),
};

// Media Units
export const mediaUnitAPI = {
  getAll: () => client.get('/media-units'),
  getById: (id: string) => client.get(`/media-units/${id}`),
  create: (data: any) => client.post('/media-units', data),
  update: (id: string, data: any) => client.put(`/media-units/${id}`, data),
  delete: (id: string) => client.delete(`/media-units/${id}`),
};

// Episode Guests
export const episodeGuestAPI = {
  getAll: () => client.get('/episode-guests'),
  getByEpisode: (episodeId: string) => client.get(`/episode-guests?episode_id=${episodeId}`),
  getByGuest: (guestId: string) => client.get(`/episode-guests?guest_id=${guestId}`),
  create: (data: any) => client.post('/episode-guests', data),
  delete: (episodeId: string, guestId: string) => client.delete(`/episode-guests/${episodeId}/${guestId}`),
};
