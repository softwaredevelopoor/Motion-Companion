'use client';

import { useEffect, useState } from 'react';
import { MetricsSnapshot } from '@motion-companion/common';
import { formatSolAmount, formatUSDAmount, formatDateTime } from '@/lib/format';

interface TreasuryMetricsProps {
  metrics: MetricsSnapshot | null;
  isLoading: boolean;
}

export function TreasuryMetricsCard({ metrics, isLoading }: TreasuryMetricsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
          <div className="h-6 bg-gray-200 rounded w-36"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Treasury Metrics</h3>
        <p className="text-red-600">Unable to load treasury data</p>
      </div>
    );
  }

  const available = metrics.totalAllocated > 0 
    ? metrics.totalFeesCollected - metrics.totalAllocated 
    : metrics.totalFeesCollected;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Treasury Metrics</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">{formatSolAmount(metrics.totalFeesCollected)}</p>
          <p className="text-xs text-gray-500">{formatUSDAmount(metrics.totalFeesCollected)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Total Allocated</p>
          <p className="text-2xl font-bold text-blue-600">{formatSolAmount(metrics.totalAllocated)}</p>
          <p className="text-xs text-gray-500">{formatUSDAmount(metrics.totalAllocated)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-gray-900">{formatSolAmount(available)}</p>
          <p className="text-xs text-gray-500">{formatUSDAmount(available)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Allocations</p>
          <p className="text-2xl font-bold text-purple-600">{metrics.allocationCount}</p>
          <p className="text-xs text-gray-500">Total executions</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <p>Last update: {formatDateTime(metrics.timestamp)}</p>
      </div>
    </div>
  );
}
