'use client';

import React from 'react';

const topCategories = [
  { name: 'Vehicles', icon: '🚗', count: 1247 },
  { name: 'Property Rentals', icon: '🏠', count: 892 },
  { name: 'Apparel', icon: '👕', count: 2156 },
  { name: 'Classified', icon: '📰', count: 543 },
  { name: 'Electronics', icon: '🎧', count: 1876 },
  { name: 'Entertainments', icon: '🎮', count: 432 },
];

export const TopCategories: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-neutral-800">Top Categories</h3>
        <a href="#" className="text-primary-500 hover:text-primary-600 font-medium text-sm transition-colors">
          See All
        </a>
      </div>
      
      <div className="flex space-x-6 overflow-x-auto pb-2">
        {topCategories.map((category, index) => (
          <div key={index} className="flex-shrink-0 text-center group cursor-pointer">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-primary-50 transition-colors">
              <span className="text-2xl">{category.icon}</span>
            </div>
            <p className="text-sm font-medium text-neutral-700 group-hover:text-primary-600 transition-colors">
              {category.name}
            </p>
            <p className="text-xs text-neutral-500">
              {category.count} items
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
