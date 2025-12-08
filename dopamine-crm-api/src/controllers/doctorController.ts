import { Request, Response, NextFunction } from 'express';
import { doctorService } from '../services/doctorService';
import logger from '../utils/logger';

export const createDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctor = await doctorService.createDoctor(req.body);
        res.status(201).json(doctor);
    } catch (error) {
        logger.error('Create doctor error:', error);
        next(error);
    }
};

export const getAllDoctors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctors = await doctorService.getAllDoctors(req.query);
        res.status(200).json(doctors);
    } catch (error) {
        logger.error('Get all doctors error:', error);
        next(error);
    }
};

export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const doctor = await doctorService.getDoctorById(Number(id));
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.status(200).json(doctor);
    } catch (error) {
        logger.error('Get doctor by ID error:', error);
        next(error);
    }
};

export const updateDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const doctor = await doctorService.updateDoctor(Number(id), req.body);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.status(200).json(doctor);
    } catch (error) {
        logger.error('Update doctor error:', error);
        next(error);
    }
};

export const deleteDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const doctor = await doctorService.deleteDoctor(Number(id));
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.status(204).send();
    } catch (error) {
        logger.error('Delete doctor error:', error);
        next(error);
    }
};
