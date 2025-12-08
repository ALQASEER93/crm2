export interface Doctor {
  id: number;
  name: string;
  specialty: string | null;
  organization: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}
