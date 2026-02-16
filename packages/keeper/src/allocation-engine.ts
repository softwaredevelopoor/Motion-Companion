import {
  AllocationConfig,
  AllocationRule,
  Logger,
  SolanaUtils,
  DateUtils,
  KEEPER_DEFAULTS,
} from '@motion-companion/common';

export class AllocationEngine {
  private config: AllocationConfig;
  private lastAllocationTime: number = 0;

  constructor(config: AllocationConfig) {
    this.config = config;
  }

  /**
   * Calculate allocations based on rules and available amount
   */
  calculateAllocations(
    availableAmount: bigint,
    treasuryBalance: bigint
  ): { rule: AllocationRule; amount: bigint }[] {
    const allocations: { rule: AllocationRule; amount: bigint }[] = [];

    if (availableAmount < this.config.minThresholdForAllocation) {
      Logger.debug('Available amount below minimum threshold for allocation');
      return allocations;
    }

    // Check cooldown period
    const timeSinceLastAllocation = DateUtils.getNowUnixTimestamp() - this.lastAllocationTime;
    if (timeSinceLastAllocation < KEEPER_DEFAULTS.allocationWaitTime) {
      Logger.debug('Still in allocation cooldown period');
      return allocations;
    }

    for (const rule of this.config.rules) {
      if (rule.percentage <= 0 || rule.percentage > 100) {
        Logger.warn(`Invalid rule percentage: ${rule.percentage}`, rule);
        continue;
      }

      const amount = (availableAmount * BigInt(rule.percentage)) / BigInt(100);

      if (amount > 0n) {
        allocations.push({
          rule,
          amount,
        });

        Logger.debug(`Calculated allocation for ${rule.name}`, {
          percentage: rule.percentage,
          amount: SolanaUtils.formatAmount(amount),
        });
      }
    }

    // Validate total allocations don't exceed available amount
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0n);
    if (totalAllocated > availableAmount) {
      Logger.warn('Total allocations exceed available amount, scaling down');
      return this.normalizeAllocations(allocations, availableAmount);
    }

    this.lastAllocationTime = DateUtils.getNowUnixTimestamp();
    return allocations;
  }

  /**
   * Normalize allocations if they exceed available amount
   */
  private normalizeAllocations(
    allocations: { rule: AllocationRule; amount: bigint }[],
    maxAmount: bigint
  ): { rule: AllocationRule; amount: bigint }[] {
    const totalOriginal = allocations.reduce((sum, a) => sum + a.amount, 0n);

    if (totalOriginal === 0n) return allocations;

    const scale = (maxAmount * BigInt(100)) / totalOriginal;

    return allocations.map((a) => ({
      rule: a.rule,
      amount: (a.amount * scale) / BigInt(100),
    }));
  }

  /**
   * Validate allocation rules
   */
  validateRules(rules: AllocationRule[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    let totalPercentage = 0;

    if (!rules || rules.length === 0) {
      errors.push('Rules array is empty');
      return { valid: false, errors };
    }

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      if (!rule.name || rule.name.trim().length === 0) {
        errors.push(`Rule ${i}: name is empty`);
      }

      if (typeof rule.percentage !== 'number' || rule.percentage <= 0 || rule.percentage > 100) {
        errors.push(`Rule ${i}: percentage must be between 0 and 100`);
      } else {
        totalPercentage += rule.percentage;
      }

      if (!rule.destination || rule.destination.trim().length === 0) {
        errors.push(`Rule ${i}: destination is empty`);
      }
    }

    if (totalPercentage !== 100) {
      errors.push(`Total percentage must equal 100, got ${totalPercentage}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if allocation should be triggered
   */
  shouldTriggerAllocation(
    availableFunds: bigint,
    timeSinceLastAllocation: number
  ): boolean {
    const pastMinThreshold = availableFunds >= this.config.minThresholdForAllocation;
    const pastCooldown = timeSinceLastAllocation >= KEEPER_DEFAULTS.allocationWaitTime;

    return pastMinThreshold && pastCooldown;
  }

  /**
   * Get allocation summary
   */
  getSummary(availableAmount: bigint): {
    wouldTrigger: boolean;
    estimatedAllocations: { rule: AllocationRule; amount: bigint }[];
  } {
    const timeSinceLastAllocation = DateUtils.getNowUnixTimestamp() - this.lastAllocationTime;
    const wouldTrigger = this.shouldTriggerAllocation(availableAmount, timeSinceLastAllocation);
    const estimatedAllocations = this.calculateAllocations(availableAmount, availableAmount);

    return {
      wouldTrigger,
      estimatedAllocations,
    };
  }
}

export class RulesValidator {
  /**
   * Compute hash of rules for verification
   */
  static computeRulesHash(rules: AllocationRule[]): Buffer {
    const rulesStr = JSON.stringify(rules);
    // Simple hash for demonstration - use proper crypto in production
    return Buffer.from(rulesStr.slice(0, 32).padEnd(32, '0'));
  }

  /**
   * Verify rules against hash
   */
  static verifyRulesHash(rules: AllocationRule[], hash: Buffer): boolean {
    const computedHash = this.computeRulesHash(rules);
    return computedHash.equals(hash);
  }
}
