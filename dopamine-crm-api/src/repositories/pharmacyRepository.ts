import { query } from '../config/db';
// We will create the Pharmacy model in the next step
// import { Pharmacy } from '../models/pharmacy.model';

export const pharmacyRepository = {
  async create(pharmacy: any): Promise<any> {
    const { name, type, city, area, phone, email, status } = pharmacy;
    const result = await query(
      'INSERT INTO pharmacies (name, type, city, area, phone, email, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, type, city, area, phone, email, status]
    );
    return result.rows[0];
  },

  async findAll(filters: any): Promise<any[]> {
    const { city, area } = filters;
    let queryString = 'SELECT * FROM pharmacies WHERE 1=1';
    const queryParams = [];

    if (city) {
      queryParams.push(city);
      queryString += ` AND city = $${queryParams.length}`;
    }
    if (area) {
      queryParams.push(area);
      queryString += ` AND area = $${queryParams.length}`;
    }

    const result = await query(queryString, queryParams);
    return result.rows;
  },

  async findById(id: number): Promise<any | null> {
    const result = await query('SELECT * FROM pharmacies WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async update(id: number, pharmacy: any): Promise<any | null> {
    const { name, type, city, area, phone, email, status } = pharmacy;
    const result = await query(
      'UPDATE pharmacies SET name=$1, type=$2, city=$3, area=$4, phone=$5, email=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [name, type, city, area, phone, email, status, id]
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<any | null> {
    const result = await query('DELETE FROM pharmacies WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  },
};
