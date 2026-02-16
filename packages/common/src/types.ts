// Types and interfaces shared across all packages

export interface TreasuryState {
  publicKey: string;
  bump: number;
  feeToken: string;
  owner: string;
  totalFeesCollected: bigint;
  totalAllocated: bigint;
  allocationCount: bigint;
  rulesHash: Buffer;
  createdAt: number;
  lastAllocationAt: number;
}

export interface AllocationRecord {
  id: bigint;
  treasury: string;
  allocationType: string;
  amount: bigint;
  destination: string;
  status: 'Pending' | 'Completed' | 'Failed';
  executedAt: number;
  bump: number;
}

export interface AllocationRule {
  name: string;
  percentage: number;
  destination: string;
}

export interface AllocationData {
  allocationType: string;
  destination: string;
  destinationAccount: string;
  amount: bigint;
}

export interface FeeRecord {
  treasury: string;
  amount: bigint;
  source: string;
  totalCollected: bigint;
  timestamp: number;
}

export interface AllocationEvent {
  allocationId: bigint;
  treasury: string;
  allocationType: string;
  amount: bigint;
  destination: string;
  timestamp: number;
}

export interface TreasuryConfig {
  rpcUrl: string;
  programId: string;
  treasuryOwner: string;
  feeTokenMint: string;
  network: 'localnet' | 'devnet' | 'mainnet-beta';
}

export interface AllocationConfig {
  rules: AllocationRule[];
  checkIntervalMs: number;
  minThresholdForAllocation: bigint;
  dryRun: boolean;
  xApiKey?: string;
  postToX: boolean;
}

export interface KeeperState {
  lastProcessedAt: number;
  totalFeesProcessed: bigint;
  totalAllocationsExecuted: number;
  isRunning: boolean;
  lastError?: {
    message: string;
    timestamp: number;
  };
}

export interface MetricsSnapshot {
  timestamp: number;
  totalFeesCollected: bigint;
  totalAllocated: bigint;
  allocationCount: number;
  availableFunds: bigint;
  lastAllocationAt: number;
  treasury: string;
}

export interface TxSignatureWithMetadata {
  signature: string;
  type: 'FeeRecorded' | 'AllocationExecuted' | 'RulesUpdated';
  amount?: bigint;
  timestamp: number;
  success: boolean;
}
