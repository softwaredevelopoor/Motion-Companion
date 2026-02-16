import { MetricsSnapshot } from '@motion-companion/common';

/**
 * Service for fetching treasury metrics from on-chain
 */
export class MetricsService {
  private baseUrl: string;
  private cacheTime: number = 5000; // 5 seconds
  private lastFetch: { [key: string]: { data: unknown; timestamp: number } } = {};

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get treasury metrics
   */
  async getTreasuryMetrics(): Promise<MetricsSnapshot | null> {
    const cacheKey = 'treasury-metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as MetricsSnapshot;

    try {
      const response = await fetch(`${this.baseUrl}/api/treasury/metrics`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error('Failed to fetch metrics:', response.statusText);
        return null;
      }

      const data = await response.json() as MetricsSnapshot;
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return null;
    }
  }

  /**
   * Get allocation history
   */
  async getAllocationHistory(limit: number = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/api/treasury/allocations?limit=${limit}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching allocation history:', error);
      return [];
    }
  }

  /**
   * Get fee records
   */
  async getFeeHistory(limit: number = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/api/treasury/fees?limit=${limit}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching fee history:', error);
      return [];
    }
  }

  /**
   * Get keeper status
   */
  async getKeeperStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/keeper/status`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching keeper status:', error);
      return null;
    }
  }

  /**
   * Cache helpers
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.lastFetch[key];
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheTime;
    if (isExpired) {
      delete this.lastFetch[key];
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: unknown): void {
    this.lastFetch[key] = {
      data,
      timestamp: Date.now(),
    };
  }
}
