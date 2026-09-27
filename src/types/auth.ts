import type { UUID, Role, ISODate } from './common';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: Role;
  userId: UUID;
  name: string;
  email: string;
  profileImageUrl: string | null;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: Role;

  // Student-specific
  rollNo?: string;
  batch?: string;
  branchId?: UUID;
  semester?: number;
  phoneNumber?: string;
  address?: string;
  dob?: ISODate;
  guardianName?: string;
  guardianPhone?: string;
  cgpa?: number;
  activeBacklogs?: number;
  linkedinProfile?: string;

  // Teacher-specific
  designation?: string;
  qualification?: string;
  cabinNumber?: string;
  joiningDate?: ISODate;
}