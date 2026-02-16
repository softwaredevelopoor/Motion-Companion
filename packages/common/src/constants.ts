export const PROGRAM_ID = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFU';
export const TREASURY_SEED = 'treasury';
export const ALLOCATION_SEED = 'allocation';

export const SOLANA_NETWORKS = {
  localnet: {
    rpc: 'http://localhost:8899',
    ws: 'ws://localhost:8900',
  },
  devnet: {
    rpc: 'https://api.devnet.solana.com',
    ws: 'wss://api.devnet.solana.com',
  },
  'mainnet-beta': {
    rpc: 'https://api.mainnet-beta.solana.com',
    ws: 'wss://api.mainnet-beta.solana.com',
  },
};

export const X_API_RATE_LIMIT = {
  interval: 900000, // 15 minutes
  tweetsPerInterval: 50,
};

export const KEEPER_DEFAULTS = {
  checkIntervalMs: 30000, // 30 seconds
  minThresholdForAllocation: BigInt(1000000), // 0.001 SOL in lamports
  allocationWaitTime: 60, // seconds before next allocation
};

export const GAS_ESTIMATES = {
  recordFee: 5000,
  executeAllocation: 8000,
  updateRules: 3000,
};
