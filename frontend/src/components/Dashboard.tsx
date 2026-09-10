'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MarketplaceDashboard } from './MarketplaceDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return <MarketplaceDashboard />;
};
