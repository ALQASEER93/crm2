import { pharmacyRepository } from '../repositories/pharmacyRepository';

export const pharmacyService = {
  async createPharmacy(pharmacyData: any) {
    return pharmacyRepository.create(pharmacyData);
  },
  async getAllPharmacies(filters: any) {
    return pharmacyRepository.findAll(filters);
  },
  async getPharmacyById(id: number) {
    return pharmacyRepository.findById(id);
  },
  async updatePharmacy(id: number, pharmacyData: any) {
    return pharmacyRepository.update(id, pharmacyData);
  },
  async deletePharmacy(id: number) {
    return pharmacyRepository.delete(id);
  },
};
