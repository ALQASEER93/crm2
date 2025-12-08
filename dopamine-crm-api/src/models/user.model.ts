export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role_id: number;
  territory_id: number | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}
