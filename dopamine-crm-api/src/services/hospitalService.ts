import { hospitalRepository } from '../repositories/hospitalRepository';

export const hospitalService = {
  async createHospital(hospitalData: any) {
    return hospitalRepository.create(hospitalData);
  },
  async getAllHospitals(filters: any) {
    return hospitalRepository.findAll(filters);
  },
  async getHospitalById(id: number) {
    return hospitalRepository.findById(id);
  },
  async updateHospital(id: number, hospitalData: any) {
    return hospitalRepository.update(id, hospitalData);
  },
  async deleteHospital(id: number) {
    return hospitalRepository.delete(id);
  },
};
