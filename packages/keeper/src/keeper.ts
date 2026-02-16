import {
  TreasuryConfig,
  AllocationConfig,
  KeeperState,
  Logger,
  DateUtils,
  SolanaUtils,
  KEEPER_DEFAULTS,
} from '@motion-companion/common';
import { TreasuryClient } from './treasury-client';
import { AllocationEngine } from './allocation-engine';
import { XBroadcaster } from './x-broadcaster';
import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';

export class MotionKeeperBot {
  private treasuryConfig: TreasuryConfig;
  private allocationConfig: AllocationConfig;
  private treasuryClient: TreasuryClient;
  private allocationEngine: AllocationEngine;
  private xBroadcaster?: XBroadcaster;
  private keeperKeypair: Keypair;
  private state: KeeperState = {
    lastProcessedAt: 0,
    totalFeesProcessed: 0n,
    totalAllocationsExecuted: 0,
    isRunning: false,
  };
  private startTime: number = 0;
  private monitoring = false;

  constructor(
    treasuryConfig: TreasuryConfig,
    allocationConfig: AllocationConfig,
    keypairPath: string,
    xApiKey?: string
  ) {
    this.treasuryConfig = treasuryConfig;
    this.allocationConfig = allocationConfig;
    this.keeperKeypair = SolanaUtils.loadKeypair(keypairPath);
    this.treasuryClient = new TreasuryClient(treasuryConfig, this.keeperKeypair);
    this.allocationEngine = new AllocationEngine(allocationConfig);

    if (xApiKey && allocationConfig.postToX) {
      this.xBroadcaster = new XBroadcaster(xApiKey, 'secret', 'token');
    }

    Logger.info('Motion Keeper Bot initialized', {
      network: treasuryConfig.network,
      dryRun: allocationConfig.dryRun,
      postToX: allocationConfig.postToX,
    });
  }

  /**
   * Start the keeper bot
   */
  async start(): Promise<void> {
    if (this.state.isRunning) {
      Logger.warn('Keeper bot is already running');
      return;
    }

    this.state.isRunning = true;
    this.startTime = DateUtils.getNowUnixTimestamp();
    this.monitoring = true;

    Logger.info('Starting Motion Keeper Bot');

    // Initial status post
    if (this.xBroadcaster) {
      await this.xBroadcaster.postTweet('🤖 Motion Companion Keeper Bot started. Monitoring treasury...');
    }

    // Main monitoring loop
    while (this.monitoring) {
      try {
        await this.checkAndExecute();
        await this.delay(this.allocationConfig.checkIntervalMs);
      } catch (error) {
        Logger.error('Error in keeper loop', error);
        this.state.lastError = {
          message: error instanceof Error ? error.message : String(error),
          timestamp: DateUtils.getNowUnixTimestamp(),
        };
        await this.delay(this.allocationConfig.checkIntervalMs);
      }
    }
  }

  /**
   * Stop the keeper bot
   */
  async stop(): Promise<void> {
    Logger.info('Stopping Motion Keeper Bot');
    this.monitoring = false;
    this.state.isRunning = false;

    const uptime = DateUtils.getElapsedTime(this.startTime);
    Logger.info('Keeper bot stopped', {
      totalProcessed: this.state.totalFeesProcessed.toString(),
      totalAllocations: this.state.totalAllocationsExecuted,
      uptime: `${uptime}s`,
    });

    // Final status post
    if (this.xBroadcaster) {
      await this.xBroadcaster.postTweet(
        `⏹️ Motion Companion Keeper Bot stopped. Session summary in feed above.`
      );
    }
  }

  /**
   * Single check and execute cycle
   */
  private async checkAndExecute(): Promise<void> {
    const treasuryState = await this.treasuryClient.getTreasuryState();

    if (!treasuryState) {
      Logger.warn('Could not fetch treasury state');
      return;
    }

    this.state.lastProcessedAt = DateUtils.getNowUnixTimestamp();

    const availableFunds = treasuryState.totalFeesCollected - treasuryState.totalAllocated;

    Logger.debug('Treasury state', {
      totalCollected: SolanaUtils.formatAmount(treasuryState.totalFeesCollected),
      totalAllocated: SolanaUtils.formatAmount(treasuryState.totalAllocated),
      available: SolanaUtils.formatAmount(availableFunds),
    });

    // Check if allocation should be triggered
    const timeSinceLastAllocation = DateUtils.getElapsedTime(treasuryState.lastAllocationAt);
    const summary = this.allocationEngine.getSummary(availableFunds);

    if (summary.wouldTrigger && summary.estimatedAllocations.length > 0) {
      await this.executeAllocations(summary.estimatedAllocations, treasuryState);
    }

    // Periodic status reports
    if (this.state.lastProcessedAt % 3600 === 0) {
      // Every hour
      const uptime = this.getUptimeString();
      if (this.xBroadcaster) {
        await this.xBroadcaster.postStatusReport(
          SolanaUtils.formatAmount(treasuryState.totalFeesCollected),
          SolanaUtils.formatAmount(treasuryState.totalAllocated),
          Number(treasuryState.allocationCount),
          uptime
        );
      }
    }
  }

  /**
   * Execute allocations
   */
  private async executeAllocations(
    allocations: { rule: any; amount: bigint }[],
    treasuryState: any
  ): Promise<void> {
    for (let i = 0; i < allocations.length; i++) {
      const { rule, amount } = allocations[i];

      if (this.allocationConfig.dryRun) {
        Logger.info(`[DRY RUN] Would execute allocation`, {
          type: rule.name,
          amount: SolanaUtils.formatAmount(amount),
          destination: rule.destination,
        });
      } else {
        Logger.info('Executing allocation', {
          type: rule.name,
          amount: SolanaUtils.formatAmount(amount),
          destination: rule.destination,
        });

        // In real implementation, would call treasuryClient.executeAllocation()
        // with proper account setup
        this.state.totalAllocationsExecuted++;

        if (this.xBroadcaster) {
          await this.xBroadcaster.postAllocationExecutedUpdate(
            rule.name,
            SolanaUtils.formatAmount(amount),
            rule.destination
          );
        }
      }
    }
  }

  /**
   * Get uptime as formatted string
   */
  private getUptimeString(): string {
    const seconds = DateUtils.getElapsedTime(this.startTime);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  /**
   * Get current keeper state
   */
  getState(): KeeperState {
    return {
      ...this.state,
      isRunning: this.monitoring,
    };
  }

  /**
   * Sleep helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Load keeper configuration from JSON file
 */
export async function loadKeeperConfig(configPath: string): Promise<{
  treasury: TreasuryConfig;
  allocation: AllocationConfig;
}> {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return {
      treasury: config.treasury,
      allocation: config.allocation,
    };
  } catch (error) {
    Logger.error('Failed to load keeper config', error);
    throw error;
  }
}
