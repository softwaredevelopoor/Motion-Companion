'use client';

import { useEffect, useState } from 'react';
import { MetricsSnapshot } from '@motion-companion/common';
import { TreasuryMetricsCard } from '@/components/MetricsCard';
import { AllocationHistory } from '@/components/AllocationHistory';
import { FeeHistory } from '@/components/FeeHistory';
import { KeeperStatus } from '@/components/KeeperStatus';
import { MetricsService } from '@/lib/metrics';

const metricsService = new MetricsService(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [allocations, setAllocations] = useState([]);
  const [fees, setFees] = useState([]);
  const [keeperStatus, setKeeperStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const [metricsData, allocationsData, feesData, statusData] = await Promise.all([
        metricsService.getTreasuryMetrics(),
        metricsService.getAllocationHistory(10),
        metricsService.getFeeHistory(10),
        metricsService.getKeeperStatus(),
      ]);

      setMetrics(metricsData);
      setAllocations(allocationsData);
      setFees(feesData);
      setKeeperStatus(statusData);
      setIsLoading(false);
    };

    fetchData();

    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Treasury Overview</h2>
        <TreasuryMetricsCard metrics={metrics} isLoading={isLoading} />
      </section>

      {/* Status and History Grid */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Operations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <KeeperStatus status={keeperStatus} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <AllocationHistory allocations={allocations} isLoading={isLoading} />
          </div>
        </div>
      </section>

      {/* Fee History */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Fee Records</h2>
        <FeeHistory fees={fees} isLoading={isLoading} />
      </section>

      {/* Information Section */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">About Motion Companion</h3>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li>✓ Autonomous keeper bot monitors protocol fees continuously</li>
          <li>✓ Capital allocation triggered by configurable thresholds</li>
          <li>✓ All operations logged transparently on-chain</li>
          <li>✓ Rule-based allocation with deterministic execution</li>
          <li>✓ Automatic status updates posted to X (Twitter)</li>
          <li>✓ Dry-run mode available for testing</li>
        </ul>
      </section>
    </div>
  );
}
