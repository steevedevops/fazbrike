'use client';

import React from 'react';

const searchBasedProducts = [
  {
    id: 1,
    title: '2020 Toyota RAV4 Hybrid',
    category: 'SUV',
    price: 45000,
    location: 'São Paulo, SP',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
  },
  {
    id: 2,
    title: '2021 Honda CBR 600RR',
    category: 'Motorcycle',
    price: 25000,
    location: 'Rio de Janeiro, RJ',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
  },
  {
    id: 3,
    title: '2019 BMW X5 M Sport',
    category: 'Cars',
    price: 180000,
    location: 'Belo Horizonte, MG',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
  },
  {
    id: 4,
    title: '2022 Yamaha NMAX 160',
    category: 'Scooter',
    price: 12000,
    location: 'Brasília, DF',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
  }
];

export const SearchBasedListings: React.FC = () => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-neutral-800">Listing Based On Your Search</h3>
        <a href="#" className="text-primary-500 hover:text-primary-600 font-medium text-sm transition-colors">
          See All
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {searchBasedProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-modern transition-all duration-200 group">
            <div className="relative h-48 bg-neutral-100 overflow-hidden">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                  {product.category}
                </span>
                <button className="p-1 hover:bg-neutral-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-neutral-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
              
              <h4 className="font-semibold text-neutral-800 text-sm mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {product.title}
              </h4>
              
              <p className="text-xs text-neutral-500 mb-2">{product.location}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-600">
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
