import { Request, Response, NextFunction } from 'express';
import { pharmacyService } from '../services/pharmacyService';
import logger from '../utils/logger';

export const createPharmacy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pharmacy = await pharmacyService.createPharmacy(req.body);
        res.status(201).json(pharmacy);
    } catch (error) {
        logger.error('Create pharmacy error:', error);
        next(error);
    }
};

export const getAllPharmacies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pharmacies = await pharmacyService.getAllPharmacies(req.query);
        res.status(200).json(pharmacies);
    } catch (error) {
        logger.error('Get all pharmacies error:', error);
        next(error);
    }
};

export const getPharmacyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const pharmacy = await pharmacyService.getPharmacyById(Number(id));
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }
        res.status(200).json(pharmacy);
    } catch (error) {
        logger.error('Get pharmacy by ID error:', error);
        next(error);
    }
};

export const updatePharmacy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const pharmacy = await pharmacyService.updatePharmacy(Number(id), req.body);
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }
        res.status(200).json(pharmacy);
    } catch (error) {
        logger.error('Update pharmacy error:', error);
        next(error);
    }
};

export const deletePharmacy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const pharmacy = await pharmacyService.deletePharmacy(Number(id));
        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }
        res.status(204).send();
    } catch (error) {
        logger.error('Delete pharmacy error:', error);
        next(error);
    }
};
