import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Configuração base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Tipos para as respostas da API
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
  status?: number;
  error?: string;
  user?: T;
  token?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
  error?: string;
}

// Tipos específicos do Fazbrike
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Item {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  category?: string;
  location?: string;
  condition?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// Classe principal do serviço de API
class ApiService {
  private axiosInstance: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // Configurar interceptors para requisições e respostas
  private setupInterceptors() {
    // Interceptor de requisição
    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        // Adicionar token de autenticação se disponível
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Log da requisição em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error: any) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de resposta
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log da resposta em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }

        return response;
      },
      (error: AxiosError) => {
        const apiError = this.handleError(error);

        // Log do erro em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ API Error:', {
            message: apiError.message,
            status: apiError.status,
            code: apiError.code,
            details: apiError.details
          });
        }

        return Promise.reject(apiError);
      }
    );
  }

  // Tratar erros da API
  private handleError(error: AxiosError): ApiError {
    const status = error.response?.status || 500;
    const responseData = error.response?.data as any;

    // Log detalhado para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Error Debug:', {
        status,
        responseData,
        errorMessage: error.message,
        errorCode: error.code
      });
    }

    // Mensagem real: o backend responde {"error": "..."} ou {"message": "..."}
    let message =
      responseData?.error ||
      responseData?.message ||
      error.message ||
      'Erro desconhecido';

    if (status === 400 && responseData?.detail) {
      message = responseData.detail;
    }

    const code = responseData?.code || error.code;
    const details = responseData?.details;

    const apiError: ApiError = {
      message,
      status,
      code,
      details,
    };

    // Log do objeto final
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Final ApiError:', apiError);
    }

    return apiError;
  }

  // Definir token de autenticação
  setAuthToken(token: string | null) {
    this.authToken = token;

    // Salvar no localStorage se disponível
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  // Obter token do localStorage
  getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return this.authToken;
  }

  // Métodos HTTP genéricos
  async get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(endpoint, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async patch<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.patch<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(endpoint, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }


  // ===== MÉTODOS DE UPLOAD/DOWNLOAD =====

  /**
   * Upload de arquivo genérico
   */
  async uploadFile(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.axiosInstance.post(endpoint, formData, {
        headers: {
          // Importante: não enviar Content-Type manualmente; o navegador define
          // o boundary do multipart/form-data automaticamente.
          'Content-Type': undefined,
        },
        onUploadProgress: (progressEvent: any) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download de arquivo genérico
   */
  async downloadFile(endpoint: string, filename?: string): Promise<void> {
    try {
      const response = await this.axiosInstance.get(endpoint, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      throw error;
    }
  }

  async getMessages(itemId: number): Promise<Message[]> {
    const response = await this.axiosInstance.get<Message[]>(`/messages/item/${itemId}`);
    return response.data;
  }

  async sendMessage(itemId: number, receiverId: number, content: string): Promise<Message> {
    const response = await this.axiosInstance.post<Message>('/messages', {
      item_id: itemId,
      receiver_id: receiverId,
      content,
    });
    return response.data;
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await this.axiosInstance.get<Conversation[]>('/messages');
    return response.data;
  }
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  item_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: User; // Assuming User interface is defined elsewhere or will be.
  receiver?: User; // Assuming User interface is defined elsewhere or will be.
}

export interface Conversation {
  item_id: number;
  item_title: string;
  item_image_url: string;
  other_user_id: number;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
}

// Resolve URLs de imagem retornadas pelo backend para URLs acessíveis no navegador.
// O banco pode ter "/uploads/x.jpg" (dados antigos) ou "/api/uploads/x.jpg" (uploads novos);
// o backend serve os arquivos estáticos em /api/uploads, então normalizamos aqui.
export function resolveImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return '/placeholder.svg';

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  const baseUrl = apiUrl.replace(/\/api\/?$/, '');

  if (imageUrl.startsWith('/api/uploads/')) {
    return `${baseUrl}${imageUrl}`;
  }

  if (imageUrl.startsWith('/uploads/')) {
    return `${baseUrl}/api${imageUrl}`;
  }

  return `${baseUrl}${imageUrl}`;
}

// Instância singleton do serviço
export const apiService = new ApiService();

// Inicializar token do localStorage se disponível
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) {
    apiService.setAuthToken(token);
  }
}

export default apiService;
