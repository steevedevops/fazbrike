'use client';

import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ProductGrid } from './ProductGrid';

export const MarketplaceDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <ProductGrid />
        </main>
      </div>
    </div>
  );
};
