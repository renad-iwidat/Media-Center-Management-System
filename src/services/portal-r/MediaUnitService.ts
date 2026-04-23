import { MediaUnitModel } from '../../models/management/MediaUnit';
import { MediaUnit, CreateMediaUnitDTO, UpdateMediaUnitDTO } from '../../types/management';

export class MediaUnitService {
  async getAllMediaUnits(): Promise<MediaUnit[]> {
    return MediaUnitModel.findAll();
  }

  async getMediaUnitById(id: bigint): Promise<MediaUnit | null> {
    return MediaUnitModel.findById(id);
  }

  async createMediaUnit(data: CreateMediaUnitDTO): Promise<MediaUnit> {
    return MediaUnitModel.create(data);
  }

  async updateMediaUnit(id: bigint, data: UpdateMediaUnitDTO): Promise<MediaUnit | null> {
    return MediaUnitModel.update(id, data);
  }

  async deleteMediaUnit(id: bigint): Promise<boolean> {
    return MediaUnitModel.delete(id);
  }
}
