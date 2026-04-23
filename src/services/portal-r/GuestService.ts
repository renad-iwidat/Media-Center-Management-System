import { GuestModel } from '../../models/content/Guest';
import { Guest, CreateGuestDTO, UpdateGuestDTO } from '../../types/content';

export class GuestService {
  async getAllGuests(): Promise<Guest[]> {
    return GuestModel.findAll(1000, 0);
  }

  async getGuestById(id: bigint): Promise<Guest | null> {
    return GuestModel.findById(id);
  }

  async createGuest(data: CreateGuestDTO): Promise<Guest> {
    return GuestModel.create(data);
  }

  async updateGuest(id: bigint, data: UpdateGuestDTO): Promise<Guest | null> {
    return GuestModel.update(id, data as Partial<Guest>);
  }

  async deleteGuest(id: bigint): Promise<boolean> {
    return GuestModel.delete(id);
  }

  async searchGuestsByName(name: string): Promise<Guest[]> {
    return GuestModel.search(name);
  }
}
