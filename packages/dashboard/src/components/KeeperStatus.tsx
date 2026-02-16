'use client';

import { useEffect, useState } from 'react';

interface KeeperStatusData {
  isRunning: boolean;
  lastProcessedAt: number;
  totalFeesProcessed: bigint;
  totalAllocationsExecuted: number;
  uptime: string;
  lastError?: {
    message: string;
    timestamp: number;
  };
}

interface KeeperStatusProps {
  status: KeeperStatusData | null;
  isLoading: boolean;
}

export function KeeperStatus({ status, isLoading }: KeeperStatusProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Keeper Bot Status</h3>
        <p className="text-gray-500">Unable to fetch keeper status</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Keeper Bot Status</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Status</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            status.isRunning
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {status.isRunning ? '🟢 Running' : '🔴 Stopped'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Uptime</span>
          <span className="font-mono text-gray-900">{status.uptime}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Allocations Executed</span>
          <span className="font-mono text-gray-900">{status.totalAllocationsExecuted}</span>
        </div>

        {status.lastError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-xs font-semibold text-red-800 mb-1">Last Error</p>
            <p className="text-xs text-red-700">{status.lastError.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
