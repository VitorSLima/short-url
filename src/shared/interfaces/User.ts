export interface User {
  id: string;
  email: string | null;
  name: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
