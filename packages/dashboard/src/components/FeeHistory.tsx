'use client';

import { formatDateTime, formatSolAmount, getTimeAgo } from '@/lib/format';

interface FeeItem {
  amount: bigint;
  source: string;
  timestamp: number;
  totalCollected: bigint;
}

interface FeeHistoryProps {
  fees: FeeItem[];
  isLoading: boolean;
}

export function FeeHistory({ fees, isLoading }: FeeHistoryProps) {
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

  if (fees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Records</h3>
        <p className="text-gray-500 text-center py-8">No fees recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Fee Records</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Source</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Running Total</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Time</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-right font-mono font-semibold text-green-600">
                  +{formatSolAmount(fee.amount)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{fee.source}</td>
                <td className="px-6 py-4 text-right font-mono text-gray-900">
                  {formatSolAmount(fee.totalCollected)}
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-500">
                  {getTimeAgo(fee.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
