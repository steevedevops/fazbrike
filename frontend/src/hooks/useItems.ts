import { useState, useCallback } from 'react';
import { Item } from '@/lib/services/api';
import { apiService } from '@/lib/services/api';

/**
 * Hook personalizado para gerenciar itens do marketplace
 * Usa diretamente a API sem controllers intermediários
 */
export const useItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (queryString?: string) => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = queryString ? `/items?${queryString}` : '/items';
      const data = await apiService.get<Item[]>(endpoint);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar itens');
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (itemData: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const newItem = await apiService.post<Item>('/items', itemData);
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar item');
      throw err;
    }
  }, []);

  const updateItem = useCallback(async (id: number, itemData: Partial<Item>) => {
    try {
      const updatedItem = await apiService.put<Item>(`/items/${id}`, itemData);
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar item');
      throw err;
    }
  }, []);

  const deleteItem = useCallback(async (id: number) => {
    try {
      await apiService.delete<void>(`/items/${id}`);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar item');
      throw err;
    }
  }, []);

  const searchItems = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.get<Item[]>(`/items?search=${encodeURIComponent(query)}`);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar itens');
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.get<Item[]>('/items/my');
      setItems(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar seus itens');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getItem = useCallback(async (id: number) => {
    try {
      return await apiService.get<Item>(`/items/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter item');
      throw err;
    }
  }, []);

  const uploadImage = useCallback(async (itemId: number, file: File, onProgress?: (progress: number) => void) => {
    try {
      return await apiService.uploadFile(`/items/${itemId}/image`, file, onProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload da imagem');
      throw err;
    }
  }, []);

  const uploadImages = useCallback(async (itemId: number, files: File[]) => {
    try {
      return await apiService.uploadFiles(`/items/${itemId}/images`, files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload das imagens');
      throw err;
    }
  }, []);

  const deleteItemImage = useCallback(async (itemId: number, imageId: number) => {
    try {
      await apiService.delete(`/items/${itemId}/images/${imageId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover imagem');
      throw err;
    }
  }, []);

  return {
    items,
    loading,
    error,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    searchItems,
    getUserItems,
    getItem,
    uploadImage,
    uploadImages,
    deleteItemImage,
  };
};
