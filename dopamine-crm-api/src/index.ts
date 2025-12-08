import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import roleRoutes from './routes/roleRoutes';
import doctorRoutes from './routes/doctorRoutes';
import pharmacyRoutes from './routes/pharmacyRoutes';
import hospitalRoutes from './routes/hospitalRoutes';
import productLineRoutes from './routes/productLineRoutes';
import productRoutes from './routes/productRoutes';
import productMaterialRoutes from './routes/productMaterialRoutes';
import visitRoutes from './routes/visitRoutes';
import orderRoutes from './routes/orderRoutes';
import reportRoutes from './routes/reportRoutes';
import errorHandler from './middleware/errorHandler';
import logger from './utils/logger';

dotenv.config();

const app: Express = express();
const port: number = Number(process.env.PORT) || 5000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Dopamine CRM API is running!');
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', roleRoutes);
app.use('/api', doctorRoutes);
app.use('/api', pharmacyRoutes);
app.use('/api', hospitalRoutes);
app.use('/api', productLineRoutes);
app.use('/api', productRoutes);
app.use('/api', productMaterialRoutes);
app.use('/api', visitRoutes);
app.use('/api', orderRoutes);
app.use('/api', reportRoutes);

// Central error handler
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server is listening on port ${port}`);
});
