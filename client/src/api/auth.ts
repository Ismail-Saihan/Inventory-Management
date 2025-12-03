import { api, setAuthToken } from './client';
import type {
  AuthResponse,
  ForgotPasswordResponse,
  PendingUser,
  RegistrationResponse,
  UserProfile
} from '../types/api';

export interface LoginRequest {
  empId: string;
  password: string;
}

export interface RegisterRequest {
  empId: string;
  name: string;
  password: string;
  designation: string;
  department: string;
  cellNo: string;
  email?: string;
}

export interface ForgotPasswordRequest {
  empId: string;
  cellNo: string;
  newPassword: string;
}

export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  setAuthToken(data.token);
  return data;
};

export const register = async (payload: RegisterRequest): Promise<RegistrationResponse> => {
  const { data } = await api.post<RegistrationResponse>('/auth/register', payload);
  return data;
};

export const forgotPassword = async (
  payload: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> => {
  const { data } = await api.post<ForgotPasswordResponse>('/auth/forgot-password', payload);
  return data;
};

export const fetchCurrentUser = async (): Promise<UserProfile> => {
  const { data } = await api.get<{ user: UserProfile }>('/auth/me');
  return data.user;
};

export const fetchPendingUsers = async (): Promise<PendingUser[]> => {
  const { data } = await api.get<{ users: PendingUser[] }>('/users/pending');
  return data.users;
};

export const approveUser = async (id: number): Promise<PendingUser> => {
  const { data } = await api.post<{ user: PendingUser }>(`/users/${id}/approve`);
  return data.user;
};
