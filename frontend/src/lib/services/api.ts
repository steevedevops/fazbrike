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
export interface UserProfile {
  id: number;
  user_id: number;
  bio?: string;
  phone?: string;
  city?: string;
  state?: string;
  state_id?: number | null;
  city_id?: number | null;
  avatar_url?: string;
  banner_url?: string;
  website?: string;
  is_public?: boolean;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
  email_verified?: boolean;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface PublicUserProfile {
  id: number;
  name: string;
  bio?: string;
  city?: string;
  state?: string;
  state_id?: number | null;
  city_id?: number | null;
  avatar_url?: string;
  banner_url?: string;
  website?: string;
  is_featured?: boolean;
  member_since: string;
  listings_count: number;
  for_sale_count: number;
  sold_count: number;
  favorites_count: number;
  followers_count: number;
  following_count: number;
  rating_average: number;
  rating_count: number;
  is_following?: boolean;
}

export interface MyProfileResponse {
  user: User;
  profile: UserProfile;
  public?: PublicUserProfile;
  listings_count: number;
}

export interface FollowUser {
  id: number;
  name: string;
  avatar_url?: string;
}

export interface ReviewReviewer {
  id: number;
  name: string;
  avatar_url?: string;
}

export interface Review {
  id: number;
  reviewer_id: number;
  reviewee_id: number;
  item_id?: number | null;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer?: ReviewReviewer;
}

export interface ReviewRequest {
  reviewee_id: number;
  item_id?: number | null;
  rating: number;
  comment?: string;
}

export interface StateOption {
  id: number;
  name: string;
  code: string;
  country_id: number;
}

export interface CityOption {
  id: number;
  name: string;
  state_id: number;
  ibge?: string;
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

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface VerifyEmailCodeRequest {
  email: string;
  code: string;
}

export interface ResendEmailCodeRequest {
  email: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ItemSeller {
  id: number;
  name: string;
  email?: string;
  created_at?: string;
}

export interface ItemImage {
  id: number;
  item_id: number;
  url: string;
  sort_order: number;
  created_at?: string;
}

export interface Item {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  images?: ItemImage[];
  category?: string;
  listing_type?: string;
  location?: string;
  city_id?: number | null;
  state_id?: number | null;
  city?: {
    id: number;
    name: string;
    state_id: number;
    state?: { id: number; name: string; code: string };
  } | null;
  condition?: string;
  attrs?: string;
  status?: string;
  sold_at?: string | null;
  user_id: number;
  user?: ItemSeller;
  created_at: string;
  updated_at: string;
  comments_count?: number;
  views_count?: number;
  favorites_count?: number;
  is_favorited?: boolean;
}

export interface AffiliatePartner {
  id: number;
  name: string;
  slug: string;
}

export interface AffiliateProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  original_price?: number | null;
  image_url: string;
  category?: string;
  coupon_code?: string;
  is_featured: boolean;
  partner: AffiliatePartner;
}

export interface ItemComment {
  id: number;
  item_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    created_at?: string;
  };
}

export interface ApiCategory {
  id: number;
  slug: string;
  name: string;
  listing_type: string;
  parent_id?: number | null;
  children?: ApiCategory[];
  sort_order?: number;
  is_active?: boolean;
  icon?: string;
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
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  // Obter token do localStorage
  getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
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

  /** Upload de várias fotos (campo multipart `files`). */
  async uploadFiles(endpoint: string, files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await this.axiosInstance.post(endpoint, formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
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

  async getMessages(itemId: number, otherUserId?: number): Promise<Message[]> {
    const params = otherUserId ? { other_user_id: otherUserId } : undefined;
    const response = await this.axiosInstance.get<Message[]>(`/messages/item/${itemId}`, { params });
    return response.data;
  }

  async sendMessage(
    itemId: number | null | undefined,
    receiverId: number,
    content: string,
    attachment?: MessageAttachment
  ): Promise<Message> {
    const payload: {
      receiver_id: number;
      content: string;
      item_id?: number;
      attachment_url?: string;
      attachment_name?: string;
      attachment_mime?: string;
      attachment_size?: number;
      attachment_kind?: string;
    } = {
      receiver_id: receiverId,
      content,
    };
    if (itemId && itemId > 0) {
      payload.item_id = itemId;
    }
    if (attachment) {
      payload.attachment_url = attachment.url;
      payload.attachment_name = attachment.name;
      payload.attachment_mime = attachment.mime;
      payload.attachment_size = attachment.size;
      payload.attachment_kind = attachment.kind;
    }
    const response = await this.axiosInstance.post<Message>('/messages', payload);
    return response.data;
  }

  /** Envia foto ou arquivo leve (≤5MB) para anexar a uma mensagem. */
  async uploadMessageAttachment(file: File): Promise<MessageAttachment> {
    return this.uploadFile('/messages/attachment', file);
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await this.axiosInstance.get<Conversation[]>('/messages');
    return response.data;
  }

  async markMessagesAsRead(itemId: number, otherUserId?: number): Promise<void> {
    const params = otherUserId ? { other_user_id: otherUserId } : undefined;
    await this.axiosInstance.put(`/messages/item/${itemId}/read`, null, { params });
  }
}

export type AttachmentKind = 'image' | 'file';

export interface MessageAttachment {
  url: string;
  name: string;
  mime: string;
  size: number;
  kind: AttachmentKind;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  item_id?: number | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar_url?: string;
  sender?: User;
  receiver?: User;
  attachment_url?: string;
  attachment_name?: string;
  attachment_mime?: string;
  attachment_size?: number;
  attachment_kind?: AttachmentKind;
}

export interface Conversation {
  item_id?: number | null;
  item_title: string;
  item_image_url: string;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar_url?: string;
  last_message: string;
  last_message_at: string;
  unread_count?: number;
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

export function affiliateRedirectUrl(productId: number): string {
  return `${API_BASE_URL.replace(/\/$/, '')}/affiliate-products/${productId}/redirect`;
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


export async function fetchMyProfile(): Promise<MyProfileResponse> {
  return apiService.get<MyProfileResponse>('/profile');
}

export async function updateMyProfile(data: Partial<{
  name: string;
  bio: string;
  phone: string;
  city: string;
  state: string;
  city_id: number | null;
  state_id: number | null;
  website: string;
  is_public: boolean;
}>): Promise<MyProfileResponse> {
  return apiService.put<MyProfileResponse>('/profile', data);
}

export async function uploadAvatar(file: File): Promise<{ avatar_url: string; profile: UserProfile }> {
  return apiService.uploadFile('/profile/avatar', file);
}

export async function uploadBanner(file: File): Promise<{ banner_url: string; profile: UserProfile }> {
  return apiService.uploadFile('/profile/banner', file);
}

export async function fetchPublicProfile(userId: number): Promise<PublicUserProfile> {
  return apiService.get<PublicUserProfile>(`/users/${userId}`);
}

export async function fetchUserListings(
  userId: number,
  opts?: { status?: string; q?: string }
): Promise<Item[]> {
  const params = new URLSearchParams();
  if (opts?.status) params.set('status', opts.status);
  if (opts?.q) params.set('q', opts.q);
  const qs = params.toString();
  return apiService.get<Item[]>(`/users/${userId}/items${qs ? `?${qs}` : ''}`);
}

export async function fetchUserReviews(userId: number): Promise<Review[]> {
  return apiService.get<Review[]>(`/users/${userId}/reviews`);
}

export async function createReview(payload: ReviewRequest): Promise<Review> {
  return apiService.post<Review>('/reviews', payload);
}

export async function updateReview(
  reviewId: number,
  payload: { rating: number; comment?: string }
): Promise<Review> {
  return apiService.put<Review>(`/reviews/${reviewId}`, payload);
}

export async function deleteReview(reviewId: number): Promise<{ deleted: boolean }> {
  return apiService.delete(`/reviews/${reviewId}`);
}

export async function fetchUserFavorites(userId: number): Promise<Item[]> {
  return apiService.get<Item[]>(`/users/${userId}/favorites`);
}

export async function favoriteItem(itemId: number): Promise<{ favorited: boolean; favorites_count: number }> {
  return apiService.post(`/items/${itemId}/favorite`);
}

export async function unfavoriteItem(itemId: number): Promise<{ favorited: boolean; favorites_count: number }> {
  return apiService.delete(`/items/${itemId}/favorite`);
}

export async function registerItemView(itemId: number): Promise<{ viewed: boolean; views_count: number }> {
  return apiService.post(`/items/${itemId}/view`);
}

export async function fetchItemComments(itemId: number): Promise<ItemComment[]> {
  return apiService.get<ItemComment[]>(`/items/${itemId}/comments`);
}

export async function createItemComment(itemId: number, content: string): Promise<ItemComment> {
  return apiService.post<ItemComment>(`/items/${itemId}/comments`, { content });
}

export async function deleteItemComment(
  itemId: number,
  commentId: number
): Promise<{ deleted: boolean }> {
  return apiService.delete(`/items/${itemId}/comments/${commentId}`);
}

export async function fetchFollowers(userId: number): Promise<FollowUser[]> {
  return apiService.get<FollowUser[]>(`/users/${userId}/followers`);
}

export async function fetchFollowing(userId: number): Promise<FollowUser[]> {
  return apiService.get<FollowUser[]>(`/users/${userId}/following`);
}

export async function followUser(userId: number): Promise<{ following: boolean }> {
  return apiService.post(`/users/${userId}/follow`);
}

export async function unfollowUser(userId: number): Promise<{ following: boolean }> {
  return apiService.delete(`/users/${userId}/follow`);
}

export interface ItemStatusSurvey {
  channel?: 'platform' | 'off_platform' | 'not_sold';
  final_price?: number | null;
  comment?: string;
}

export async function updateItemStatus(
  itemId: number,
  status: string,
  survey?: ItemStatusSurvey
): Promise<Item> {
  return apiService.put<Item>(`/items/${itemId}/status`, { status, ...survey });
}

export async function duplicateItem(itemId: number): Promise<Item> {
  return apiService.post<Item>(`/items/${itemId}/duplicate`);
}

export interface Boost {
  id: number;
  item_id: number;
  user_id: number;
  status: string;
  notes?: string;
  requested_at: string;
  activated_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export async function requestBoost(itemId: number): Promise<Boost> {
  return apiService.post<Boost>(`/items/${itemId}/boost`);
}

export async function fetchStates(): Promise<StateOption[]> {
  return apiService.get<StateOption[]>('/states');
}

export async function fetchCities(stateId: number, q?: string): Promise<CityOption[]> {
  const params = new URLSearchParams({ state_id: String(stateId) });
  if (q) params.set('q', q);
  return apiService.get<CityOption[]>(`/cities?${params.toString()}`);
}

export async function fetchCategories(listingType?: string): Promise<ApiCategory[]> {
  const qs = listingType ? `?listing_type=${encodeURIComponent(listingType)}` : '';
  return apiService.get<ApiCategory[]>(`/categories${qs}`);
}

export default apiService;
