import { Role } from './common';

export interface UserSummary {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: Role;
  marketingConsent: boolean;
  assignedOutletId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  phone: string;
  role: Role;
  assignedOutletId?: string | null;
  iat?: number;
  exp?: number;
}

export interface RegisterInput {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  marketingConsent?: boolean;
  role?: Role;
  assignedOutletId?: string;
}

export interface LoginInput {
  emailOrPhone: string;
  password: string;
}

export interface AuthResponseData {
  token: string;
  user: UserSummary;
}

