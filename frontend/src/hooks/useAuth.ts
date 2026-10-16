import { useState, useEffect } from 'react';
import {
  User,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailCodeRequest,
  ResendEmailCodeRequest,
  LoginResponse,
} from '@/lib/services/api';
import { apiService } from '@/lib/services/api';
import { signInWithSocial, type SocialProvider } from '@/lib/firebase';

/**
 * Hook personalizado para gerenciar autenticação
 * Usa diretamente a API sem controllers intermediários
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicializar token do localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      apiService.setAuthToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const userData = await apiService.get<User>('/auth/me');
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Token inválido, limpar dados
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const credentials: LoginRequest = { email, password };
      const data = await apiService.post<LoginResponse>('/auth/login', credentials);
      
      setUser(data.user);
      setToken(data.token);
      apiService.setAuthToken(data.token);
      localStorage.setItem('token', data.token);
    } catch (error) {
      throw error;
    }
  };

  // Google/Apple: o Firebase confirma a identidade e o backend devolve o JWT
  // do Fazbrike. Conta nova é criada já verificada, com o aceite dos termos
  // exibido junto aos botões.
  const socialLogin = async (provider: SocialProvider) => {
    const { idToken, name } = await signInWithSocial(provider);
    const data = await apiService.post<LoginResponse>('/auth/social', {
      id_token: idToken,
      name,
      accept_terms: true,
    });
    setUser(data.user);
    setToken(data.token);
    apiService.setAuthToken(data.token);
    localStorage.setItem('token', data.token);
  };

  // Cadastro não loga direto: a conta fica pendente até o código enviado por
  // email ser confirmado em verifyEmailCode().
  const register = async (name: string, email: string, password: string, acceptTerms: boolean) => {
    const userData: RegisterRequest = { name, email, password, accept_terms: acceptTerms };
    return apiService.post<RegisterResponse>('/auth/register', userData);
  };

  const verifyEmailCode = async (email: string, code: string) => {
    const payload: VerifyEmailCodeRequest = { email, code };
    const data = await apiService.post<LoginResponse>('/auth/verify-code', payload);

    setUser(data.user);
    setToken(data.token);
    apiService.setAuthToken(data.token);
    localStorage.setItem('token', data.token);
  };

  const resendEmailCode = async (email: string) => {
    const payload: ResendEmailCodeRequest = { email };
    return apiService.post<{ message: string }>('/auth/resend-code', payload);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    apiService.setAuthToken(null);
    localStorage.removeItem('token');
  };

  return {
    user,
    token,
    login,
    socialLogin,
    register,
    verifyEmailCode,
    resendEmailCode,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
  };
};
