import { useState } from 'react';
import { apiService } from '@/lib/services/api';

/**
 * Hook personalizado para operações gerais da aplicação
 * Usa diretamente a API sem controllers intermediários
 */
export const useApp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const healthCheck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.get<{ status: string }>('/health');
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar saúde da API');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.get<{
        totalUsers: number;
        totalItems: number;
        totalCategories: number;
      }>('/stats');
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter estatísticas');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.get<{
        maxFileSize: number;
        allowedFileTypes: string[];
        maxItemsPerUser: number;
      }>('/config');
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter configurações');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (endpoint: string, file: File, onProgress?: (progress: number) => void) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.uploadFile(endpoint, file, onProgress);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (endpoint: string, filename?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiService.downloadFile(endpoint, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no download');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    healthCheck,
    getStats,
    getConfig,
    uploadFile,
    downloadFile,
  };
};
