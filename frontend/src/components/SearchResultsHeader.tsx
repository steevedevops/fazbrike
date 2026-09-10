'use client';

import React from 'react';

export const SearchResultsHeader: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* Results count and sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">1 - 16</span> over <span className="font-medium text-gray-900">7,000</span> results for <span className="font-bold text-gray-900">'Asus'</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-3 pr-8">
            <option>Best Match</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest</option>
          </select>
        </div>
      </div>

      {/* Active filters */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-sm text-gray-500 mr-2">Active filters:</span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
          Ready to ship
          <button className="ml-1.5 text-blue-400 hover:text-blue-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
          Paid Samples
          <button className="ml-1.5 text-blue-400 hover:text-blue-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
        <button className="text-sm text-gray-500 hover:text-gray-900 font-medium ml-auto underline decoration-dotted">
          Clear All
        </button>
      </div>
    </div>
  );
};
