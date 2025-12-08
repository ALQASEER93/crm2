import { query } from '../config/db';

// Assuming a Doctor model/interface exists in src/models/doctor.model.ts
export const doctorRepository = {
  async create(doctor: any) {
    const { name, specialty, organization, city, area, phone, email, status } = doctor;
    const result = await query(
      'INSERT INTO doctors (name, specialty, organization, city, area, phone, email, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, specialty, organization, city, area, phone, email, status]
    );
    return result.rows[0];
  },

  async findAll(filters: any) {
    const { specialty, city, area } = filters;
    let queryString = 'SELECT * FROM doctors WHERE 1=1';
    const queryParams = [];

    if (specialty) {
      queryParams.push(specialty);
      queryString += ` AND specialty = $${queryParams.length}`;
    }
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

  async findById(id: number) {
    const result = await query('SELECT * FROM doctors WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async update(id: number, doctor: any) {
    const { name, specialty, organization, city, area, phone, email, status } = doctor;
    const result = await query(
      'UPDATE doctors SET name=$1, specialty=$2, organization=$3, city=$4, area=$5, phone=$6, email=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [name, specialty, organization, city, area, phone, email, status, id]
    );
    return result.rows[0] || null;
  },

  async delete(id: number) {
    const result = await query('DELETE FROM doctors WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  },
};
