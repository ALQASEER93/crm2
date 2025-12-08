import { Request, Response, NextFunction } from 'express';
import { hospitalService } from '../services/hospitalService';
import logger from '../utils/logger';

export const createHospital = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hospital = await hospitalService.createHospital(req.body);
        res.status(201).json(hospital);
    } catch (error) {
        logger.error('Create hospital error:', error);
        next(error);
    }
};

export const getAllHospitals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hospitals = await hospitalService.getAllHospitals(req.query);
        res.status(200).json(hospitals);
    } catch (error) {
        logger.error('Get all hospitals error:', error);
        next(error);
    }
};

export const getHospitalById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const hospital = await hospitalService.getHospitalById(Number(id));
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        res.status(200).json(hospital);
    } catch (error) {
        logger.error('Get hospital by ID error:', error);
        next(error);
    }
};

export const updateHospital = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const hospital = await hospitalService.updateHospital(Number(id), req.body);
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        res.status(200).json(hospital);
    } catch (error) {
        logger.error('Update hospital error:', error);
        next(error);
    }
};

export const deleteHospital = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const hospital = await hospitalService.deleteHospital(Number(id));
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        res.status(204).send();
    } catch (error) {
        logger.error('Delete hospital error:', error);
        next(error);
    }
};
