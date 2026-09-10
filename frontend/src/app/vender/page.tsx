'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useItems } from '@/hooks/useItems';

export default function VenderPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { createItem, uploadImage } = useItems();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        location: '',
        condition: 'new'
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Protect route
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Criar o item
            const newItem = await createItem({
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category,
                location: formData.location,
                condition: formData.condition
            });

            // 2. Upload da imagem (se houver)
            if (imageFile && newItem.id) {
                await uploadImage(newItem.id, imageFile);
            }

            router.push('/');
        } catch (err) {
            console.error('Error creating item:', err);
            const message =
                err && typeof err === 'object' && 'message' in err
                    ? String((err as { message?: unknown }).message)
                    : '';
            setError(message || 'Erro ao criar anúncio. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-8">Vender um item</h1>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fotos
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-gray-900 transition-colors cursor-pointer relative bg-gray-50">
                                <div className="space-y-1 text-center">
                                    {previewUrl ? (
                                        <div className="relative h-48 w-full">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="mx-auto h-full object-contain rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setImageFile(null);
                                                    setPreviewUrl(null);
                                                }}
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <svg
                                                className="mx-auto h-12 w-12 text-gray-400"
                                                stroke="currentColor"
                                                fill="none"
                                                viewBox="0 0 48 48"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                    strokeWidth={2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <div className="flex text-sm text-gray-600">
                                                <label
                                                    htmlFor="file-upload"
                                                    className="relative cursor-pointer bg-white rounded-md font-medium text-gray-900 hover:text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-900"
                                                >
                                                    <span>Upload um arquivo</span>
                                                    <input
                                                        id="file-upload"
                                                        name="file-upload"
                                                        type="file"
                                                        className="sr-only"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                </label>
                                                <p className="pl-1">ou arraste e solte</p>
                                            </div>
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                Título
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm p-3 border"
                                placeholder="Ex: iPhone 13 Pro Max"
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                Preço
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">R$</span>
                                </div>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    className="block w-full pl-10 rounded-xl border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm p-3 border"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                Categoria
                            </label>
                            <select
                                id="category"
                                name="category"
                                required
                                value={formData.category}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm p-3 border bg-white"
                            >
                                <option value="">Selecione uma categoria</option>
                                <option value="eletronicos">Eletrônicos</option>
                                <option value="moveis">Móveis</option>
                                <option value="roupas">Roupas e Acessórios</option>
                                <option value="veiculos">Veículos</option>
                                <option value="imoveis">Imóveis</option>
                                <option value="esportes">Esportes e Lazer</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>

                        {/* Condition */}
                        <div>
                            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                                Condição
                            </label>
                            <select
                                id="condition"
                                name="condition"
                                required
                                value={formData.condition}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm p-3 border bg-white"
                            >
                                <option value="new">Novo</option>
                                <option value="used_like_new">Usado - Como novo</option>
                                <option value="used_good">Usado - Bom</option>
                                <option value="used_fair">Usado - Aceitável</option>
                            </select>
                        </div>

                        {/* Location */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                Localização
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                required
                                value={formData.location}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm p-3 border"
                                placeholder="Ex: São Paulo, SP"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Descrição
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                required
                                value={formData.description}
                                onChange={handleInputChange}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm p-3 border"
                                placeholder="Descreva os detalhes do seu item..."
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors ${loading ? 'opacity-75 cursor-not-allowed' : ''
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Publicando...
                                    </span>
                                ) : (
                                    'Publicar Anúncio'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
