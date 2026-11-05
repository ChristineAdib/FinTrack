export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  user: User;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
