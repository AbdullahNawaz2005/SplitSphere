import { apiRequest, AuthResponse, ApiUser, tokenStore } from './api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  name: string
}

export interface GoogleLoginRequest {
  idToken: string
}

const persistAuth = (response: AuthResponse) => {
  const token = response.accessToken ?? response.token
  if (!token) {
    throw new Error('Backend did not return an access token.')
  }
  tokenStore.setToken(token)
  tokenStore.setUser(response.user)
  return response
}

export const authService = {
  login: (body: LoginRequest) =>
    apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(persistAuth),

  register: (body: RegisterRequest) =>
    apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(persistAuth),

  googleLogin: (body: GoogleLoginRequest) =>
    apiRequest<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(persistAuth),

  me: () => apiRequest<ApiUser>('/api/auth/me'),

  logout: () => tokenStore.clearAll(),
}
