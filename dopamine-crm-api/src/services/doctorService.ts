import { doctorRepository } from '../repositories/doctorRepository';

export const doctorService = {
  async createDoctor(doctorData: any) {
    return doctorRepository.create(doctorData);
  },
  async getAllDoctors(filters: any) {
    return doctorRepository.findAll(filters);
  },
  async getDoctorById(id: number) {
    return doctorRepository.findById(id);
  },
  async updateDoctor(id: number, doctorData: any) {
    return doctorRepository.update(id, doctorData);
  },
  async deleteDoctor(id: number) {
    return doctorRepository.delete(id);
  },
};
