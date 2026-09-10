'use client';

import React from 'react';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/services/api';

interface ProductCardProps {
  id: number;
  price: number;
  name: string;
  imageUrl?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id, // Destructured id
  price,
  name,
  imageUrl
}) => {
  const finalImageUrl = resolveImageUrl(imageUrl);

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);

  return (
    <Link href={`/produto/${id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
          <img
            src={finalImageUrl}
            alt={name}
            className="w-full h-full object-cover object-center transition-transform duration-500"
          />

          {/* Quick Action Button */}
          <button className="absolute bottom-4 right-4 bg-white text-gray-900 p-3 rounded-full shadow-lg hover:bg-gray-900 hover:text-white transition-colors duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-base font-medium text-gray-900 mb-2 line-clamp-2">
            {name}
          </h3>

          <div className="mt-auto flex items-center justify-between">
            <p className="text-xl font-bold text-gray-900">
              {formattedPrice}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};