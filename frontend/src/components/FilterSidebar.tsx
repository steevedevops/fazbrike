'use client';

import React, { useState } from 'react';

export const FilterSidebar: React.FC = () => {
  const [minOrder, setMinOrder] = useState(500);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  return (
    <div className="h-full p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Filter</h2>

      {/* Suppliers Types */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Suppliers Types</h3>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
            />
            <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Trade Assurance</span>
          </label>
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
            />
            <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Verified Suppliers</span>
          </label>
        </div>
      </div>

      {/* Product Types */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Product Types</h3>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
            />
            <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Ready to Ship</span>
          </label>
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
            />
            <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Paid Samples</span>
          </label>
        </div>
      </div>

      {/* Condition */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Condition</h3>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
            />
            <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">New Stuff</span>
          </label>
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
            />
            <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Second hand</span>
          </label>
        </div>
      </div>

      {/* Min Order */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Min Order</h3>
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
            <input
              type="text"
              value={minOrder}
              readOnly
              className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
            />
          </div>
          <input
            type="range"
            min="10"
            max="1000"
            value={minOrder}
            onChange={(e) => setMinOrder(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>10</span>
            <span>1000</span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Price</h3>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <input
              type="text"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
              Under $500
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
              $500 - $1000
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
              $1000 - $1500
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
