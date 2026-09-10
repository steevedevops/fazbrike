'use client';

import React from 'react';

const activeFilters = [
  { label: 'Ready to ship', onRemove: () => {} },
  { label: 'Paid Samples', onRemove: () => {} },
  { label: 'Price Minimum', onRemove: () => {} },
  { label: 'Price Maximum', onRemove: () => {} },
  { label: 'Minimal Order', onRemove: () => {} },
];

export const ActiveFilters: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      {activeFilters.map((filter, index) => (
        <div key={index} className="flex items-center bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm">
          <span>{filter.label}</span>
          <button
            onClick={filter.onRemove}
            className="ml-2 hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button className="text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors">
        Clear All Filters
      </button>
    </div>
  );
};
