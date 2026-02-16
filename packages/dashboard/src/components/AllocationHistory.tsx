'use client';

import { formatDateTime, formatSolAmount, getTimeAgo } from '@/lib/format';

interface AllocationItem {
  id: number;
  allocationType: string;
  amount: bigint;
  destination: string;
  executedAt: number;
}

interface AllocationHistoryProps {
  allocations: AllocationItem[];
  isLoading: boolean;
}

export function AllocationHistory({ allocations, isLoading }: AllocationHistoryProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Allocations</h3>
        <p className="text-gray-500 text-center py-8">No allocations yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Recent Allocations</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Destination</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Time</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((alloc) => (
              <tr key={alloc.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                    {alloc.allocationType}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono font-semibold text-blue-600">
                  {formatSolAmount(alloc.amount)} SOL
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{alloc.destination}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-500">
                  {getTimeAgo(alloc.executedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
