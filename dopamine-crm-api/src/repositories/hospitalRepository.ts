import { query } from '../config/db';

export const hospitalRepository = {
  async create(hospital: any) {
    const { name, city, area, phone, status } = hospital;
    const result = await query(
      'INSERT INTO hospitals (name, city, area, phone, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, city, area, phone, status]
    );
    return result.rows[0];
  },

  async findAll(filters: any) {
    const { city, area } = filters;
    let queryString = 'SELECT * FROM hospitals WHERE 1=1';
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

  async findById(id: number) {
    const result = await query('SELECT * FROM hospitals WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async update(id: number, hospital: any) {
    const { name, city, area, phone, status } = hospital;
    const result = await query(
      'UPDATE hospitals SET name=$1, city=$2, area=$3, phone=$4, status=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [name, city, area, phone, status, id]
    );
    return result.rows[0] || null;
  },

  async delete(id: number) {
    const result = await query('DELETE FROM hospitals WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  },
};
