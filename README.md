# Motion Companion 

![image (35)](https://github.com/user-attachments/assets/fabf69d5-439d-4f42-8cd8-a9a401078e33)

X: https://x.com/MotionCompanion

**Autonomous AI Agent Treasury Management on Solana**

Motion Companion is a transparent, rule-based treasury automation framework that demonstrates continuous operational activity and capital flow tracking on Solana. The system autonomously manages protocol-generated fees, routes them into an on-chain treasury, executes predefined capital allocation strategies, logs all operations on-chain, publishes transparent reports, and broadcasts activity updates to X (formerly Twitter).

## 🎯 Vision

Create a fully transparent treasury system where:
- **Deterministic**: All operations follow predefined rules
- **Transparent**: Every transaction is logged on-chain
- **Configurable**: Rules can be updated via governance
- **Auditable**: Complete operation history available
- **Automated**: Continuous keeper bot monitors and executes

## 🏗️ Architecture

```
Motion Companion
├── packages/
│   ├── contract/          # Solana smart contract (Anchor)
│   ├── keeper/            # Automation keeper bot (TypeScript)
│   ├── dashboard/         # Public dashboard (Next.js)
│   └── common/            # Shared types and utilities
├── docs/                  # Documentation
└── scripts/               # Deployment and setup scripts
```

### Component Overview

**Smart Contract (Anchor)**
- Treasury account management
- Fee recording with source tracking
- Capital allocation execution
- On-chain event logging
- Rule-based governance

**Keeper Bot (TypeScript)**
- Continuous treasury monitoring
- Threshold-based allocation triggers
- Configurable allocation rules
- X (Twitter) social broadcasting
- Dry-run mode for testing

**Dashboard (Next.js)**
- Real-time treasury metrics
- Transaction history visualization
- Keeper bot status monitoring
- Responsive UI for all devices

**Common Library**
- Shared TypeScript types
- Utility functions
- Constants and configuration
- Solana integration helpers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Solana CLI 1.18+
- Anchor Framework 0.29+
- Rust (for contract compilation)

### Installation

```bash
# Clone repository
git clone https://github.com/softwaredevelopoor/Motion-Companion.git
cd Motion-Companion

# Install dependencies
npm install

# Build all packages
npm run build
```

### Configuration

Create `.env.local` in the root directory:

```env
# Network Configuration
NEXT_PUBLIC_RPC_URL=http://localhost:8899
NEXT_PUBLIC_NETWORK=localnet

# Treasury Configuration  
TREASURY_OWNER_PUBKEY=YOUR_PUBKEY
FEE_TOKEN_MINT=EPjFWaLb3odcccccccccccccccccccccccccccccccc

# Keeper Configuration
KEEPER_DRY_RUN=true
KEEPER_CHECK_INTERVAL_MS=30000

# X API Configuration (optional)
X_API_KEY=your_x_api_key
X_API_SECRET=your_x_api_secret
X_ACCESS_TOKEN=your_access_token
POST_TO_X=false
```

## 📦 Smart Contract

### Program ID

```
9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFU
```

### Key Instructions

#### `initialize_treasury`
Creates and initializes the treasury account.

```rust
pub fn initialize_treasury(
    ctx: Context<InitializeTreasury>,
    allocation_rules: Vec<AllocationRule>,
) -> Result<()>
```

**Parameters:**
- `allocation_rules`: Initial set of capital allocation rules

**Accounts:**
- `treasury`: PDA account to initialize
- `fee_token`: SPL token mint for fees
- `owner`: Treasury owner (signer)

**Events:** `TreasuryInitialized`

#### `record_fee`
Records incoming protocol fees and transfers to treasury vault.

```rust
pub fn record_fee(
    ctx: Context<RecordFee>,
    amount: u64,
    source: String,
) -> Result<()>
```

**Parameters:**
- `amount`: Fee amount in smallest token unit
- `source`: Human-readable source identifier

**Accounts:**
- `treasury`: Treasury state account
- `treasury_vault`: Vault token account
- `fee_source`: Source fee token account
- `fee_collector`: Account authorized to record fees

**Events:** `FeeRecorded`

**Example:**
```typescript
// Record 10 tokens from "protocol" source
await program.methods
  .recordFee(new BN(10_000_000), "protocol")
  .accounts({
    treasury: treasuryPubkey,
    treasuryVault: vaultPubkey,
    feeSource: sourcePubkey,
    feeCollector: feeCollectorKeypair.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([feeCollectorKeypair])
  .rpc();
```

#### `execute_allocation`
Executes capital allocation according to rules.

```rust
pub fn execute_allocation(
    ctx: Context<ExecuteAllocation>,
    allocation_id: u64,
    allocation_data: AllocationData,
    amount: u64,
) -> Result<()>
```

**Parameters:**
- `allocation_id`: Unique allocation identifier
- `allocation_data`: Type, destination, and account details
- `amount`: Amount to allocate

**Accounts:**
- `treasury`: Treasury state account
- `allocation`: New allocation record account (PDA)
- `treasury_vault`: Source vault account
- `allocator`: Account authorized to execute allocations

**Events:** `AllocationExecuted`

**Example:**
```typescript
// Execute allocation to development fund
await program.methods
  .executeAllocation(
    new BN(1),
    {
      allocationType: "Development Fund",
      destination: "dev-multisig",
      destinationAccount: devMultisigPubkey,
    },
    new BN(5_000_000),
  )
  .accounts({
    treasury: treasuryPubkey,
    allocation: allocationPDA,
    treasuryVault: vaultPubkey,
    allocator: allocatorKeypair.publicKey,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([allocatorKeypair])
  .rpc();
```

#### `update_rules`
Updates treasury allocation rules (governance controlled).

```rust
pub fn update_rules(
    ctx: Context<UpdateRules>,
    new_rules: Vec<AllocationRule>,
) -> Result<()>
```

**Parameters:**
- `new_rules`: New set of allocation rules

**Restrictions:** Owner only

**Events:** `RulesUpdated`

### Data Structures

#### Treasury Account
```rust
pub struct Treasury {
    pub bump: u8,                          // PDA bump seed
    pub fee_token: Pubkey,                 // SPL token mint
    pub owner: Pubkey,                     // Owner/governance
    pub total_fees_collected: u64,         // Total collected
    pub total_allocated: u64,              // Total allocated
    pub allocation_count: u64,             // Number of allocations
    pub rules_hash: [u8; 32],              // Rules verification hash
    pub created_at: i64,                   // Creation timestamp
    pub last_allocation_at: i64,           // Last allocation time
}
```

#### Allocation Account
```rust
pub struct Allocation {
    pub id: u64,                    // Unique ID
    pub treasury: Pubkey,           // Parent treasury
    pub allocation_type: String,    // Type/name
    pub amount: u64,                // Allocated amount
    pub destination: String,        // Destination label
    pub status: AllocationStatus,   // Pending/Completed/Failed
    pub executed_at: i64,           // Execution timestamp
    pub bump: u8,                   // PDA bump seed
}
```

### Events

All major operations emit events for transparency and indexing.

#### TreasuryInitialized
```rust
pub struct TreasuryInitialized {
    pub treasury: Pubkey,
    pub owner: Pubkey,
    pub fee_token: Pubkey,
    pub created_at: i64,
    pub rules_hash: [u8; 32],
}
```

#### FeeRecorded
```rust
pub struct FeeRecorded {
    pub treasury: Pubkey,
    pub amount: u64,
    pub source: String,
    pub total_collected: u64,
    pub timestamp: i64,
}
```

#### AllocationExecuted
```rust
pub struct AllocationExecuted {
    pub allocation_id: u64,
    pub treasury: Pubkey,
    pub allocation_type: String,
    pub amount: u64,
    pub destination: String,
    pub timestamp: i64,
}
```

#### RulesUpdated
```rust
pub struct RulesUpdated {
    pub treasury: Pubkey,
    pub new_rules_hash: [u8; 32],
    pub updated_at: i64,
}
```

### Building & Deployment

```bash
# Build contract
cd packages/contract
cargo build-sbf

# Deploy to localnet
anchor deploy

# Run tests
anchor test
```

## 🤖 Keeper Bot

Autonomous bot that monitors treasury and executes allocations based on configurable rules.

### Features

- **Continuous Monitoring**: Polls treasury state at configurable intervals
- **Threshold Triggers**: Executes allocations when conditions met
- **Rule Engine**: Flexible percentage-based allocation system
- **Social Broadcasting**: Posts updates to X (Twitter)
- **Dry Run Mode**: Test allocations without on-chain execution
- **Metrics Tracking**: Detailed operation statistics

### Configuration

Edit `packages/keeper/config.json`:

```json
{
  "treasury": {
    "rpcUrl": "http://localhost:8899",
    "programId": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFU",
    "treasuryOwner": "YOUR_TREASURY_OWNER_PUBKEY",
    "feeTokenMint": "EPjFWaLb3odcccccccccccccccccccccccccccccccc",
    "network": "localnet"
  },
  "allocation": {
    "rules": [
      {
        "name": "Development Fund",
        "percentage": 40,
        "destination": "dev-multisig"
      },
      {
        "name": "Marketing Initiative",
        "percentage": 30,
        "destination": "marketing-wallet"
      },
      {
        "name": "Community Rewards",
        "percentage": 20,
        "destination": "community-treasury"
      },
      {
        "name": "Reserve Buffer",
        "percentage": 10,
        "destination": "reserve-vault"
      }
    ],
    "checkIntervalMs": 30000,
    "minThresholdForAllocation": 1000000,
    "dryRun": true,
    "postToX": false
  }
}
```

### Running the Keeper

```bash
# Development mode
npm run keeper:dev

# Production mode
npm run keeper:start

# With custom config
KEEPER_CONFIG=/path/to/config.json npm run keeper:start
```

### Allocation Rules

Rules must sum to 100% and are validated before execution. Each rule specifies:

```typescript
interface AllocationRule {
  name: string;        // Human-readable name (e.g., "Development Fund")
  percentage: number;  // Portion of available funds (0-100)
  destination: string; // Target identifier
}
```

**Example Rules:**
```json
[
  { "name": "Development", "percentage": 40, "destination": "dev-wallet" },
  { "name": "Marketing", "percentage": 30, "destination": "marketing-wallet" },
  { "name": "Community", "percentage": 20, "destination": "community-vault" },
  { "name": "Reserve", "percentage": 10, "destination": "reserve-wallet" }
]
```

### State Management

The keeper tracks:

```typescript
interface KeeperState {
  lastProcessedAt: number;           // Last check timestamp
  totalFeesProcessed: bigint;        // Cumulative fees processed
  totalAllocationsExecuted: number;  // Allocation count
  isRunning: boolean;                // Bot status
  lastError?: {
    message: string;
    timestamp: number;
  };
}
```

### X Broadcasting

Posts updates for:
- Fee recordings
- Allocation executions
- Rule updates
- Hourly status reports

Example tweets:
```
📊 Fee Recorded: 5.25 SOL collected from protocol
🏦 Total Treasury: 150.75 SOL

💰 Capital Allocated: Development Fund
📤 Amount: 60.30 SOL
🎯 Destination: dev-multisig

⚙️ Treasury Rules Updated
📋 4 allocation rules now active
🔒 All changes logged onchain
```

## 📊 Dashboard

Next.js-based public dashboard for real-time treasury monitoring.

### Features

- **Live Metrics**: Treasury balance, fees collected, allocations
- **Transaction History**: Fee records and allocation events
- **Keeper Status**: Bot health and activity monitoring
- **Responsive Design**: Mobile-friendly interface
- **Auto-refresh**: Data updates every 10 seconds

### Running the Dashboard

```bash
# Development
npm run dashboard:dev

# Production build
npm run dashboard:build
npm run dashboard:start
```

Navigate to `http://localhost:3000`

### Components

#### MetricsCard
Displays key treasury metrics:

```typescript
interface MetricsCard {
  totalCollected: bigint;    // Total fees collected
  totalAllocated: bigint;    // Total allocated
  available: bigint;         // Available funds
  allocationCount: number;   // Number of allocations
}
```

#### AllocationHistory
Table of recent allocations with type, amount, destination, and time.

#### FeeHistory
Table of fee records showing amount, source, running total, and time.

#### KeeperStatus
Bot status indicator with uptime, execution count, and error tracking.

## 🔧 API Reference

The dashboard fetches from the following API endpoints:

### GET `/api/treasury/metrics`
Returns current treasury state.

```json
{
  "timestamp": 1708099200,
  "totalFeesCollected": 150750000000,
  "totalAllocated": 75000000000,
  "allocationCount": 12,
  "availableFunds": 75750000000,
  "treasury": "2pVzC8h1yDrUtmMXBpdzjjmN1LRtdaYLe8RTYbqvpbkk"
}
```

### GET `/api/treasury/allocations?limit=20`
Returns recent allocation records.

```json
[
  {
    "id": 12,
    "allocationType": "Development Fund",
    "amount": 5250000000,
    "destination": "dev-multisig",
    "executedAt": 1708099100,
    "status": "Completed"
  }
]
```

### GET `/api/treasury/fees?limit=20`
Returns recent fee records.

```json
[
  {
    "amount": 1000000000,
    "source": "protocol",
    "timestamp": 1708099050,
    "totalCollected": 150750000000
  }
]
```

### GET `/api/keeper/status`
Returns keeper bot status.

```json
{
  "isRunning": true,
  "lastProcessedAt": 1708099100,
  "totalAllocationsExecuted": 12,
  "uptime": "24h 30m",
  "lastError": null
}
```

## 📚 Usage Examples

### Example 1: Initialize Treasury

```typescript
import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { TreasuryClient } from '@motion-companion/keeper';

// Setup
const connection = new Connection('http://localhost:8899');
const ownerKeypair = Keypair.generate();
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(ownerKeypair), {});

const treasuryConfig = {
  rpcUrl: 'http://localhost:8899',
  programId: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFU',
  treasuryOwner: ownerKeypair.publicKey.toBase58(),
  feeTokenMint: 'EPjFWaLb3odcccccccccccccccccccccccccccccccc',
  network: 'localnet' as const,
};

const client = new TreasuryClient(treasuryConfig, ownerKeypair);

// Initialize with allocation rules
const rules = [
  { name: 'Development', percentage: 40, destination: 'dev-wallet' },
  { name: 'Marketing', percentage: 60, destination: 'marketing-wallet' },
];

// Would call: await client.initializeTreasury(rules);
console.log('Treasury initialized with rules:', rules);
```

### Example 2: Record Fee

```typescript
// Record 5 SOL from protocol
const feeAmount = BigInt(5_000_000_000); // 5 SOL in lamports
const feeSource = 'protocol-swap-fees';

const signature = await client.recordFee(
  feeSourcePubkey,
  treasuryVaultPubkey,
  feeCollectorKeypair,
  feeAmount,
  feeSource
);

console.log(`Fee recorded: ${feeAmount.toString()} lamports`);
console.log(`Transaction: ${signature}`);
```

### Example 3: Execute Allocation

```typescript
// Execute allocation to development fund
const allocationData = {
  allocationType: 'Development Fund Allocation',
  destination: 'dev-multisig',
  destinationAccount: devMultisigPubkey,
  amount: BigInt(2_000_000_000), // 2 SOL
};

const signature = await client.executeAllocation(
  BigInt(1), // allocation ID
  allocationData,
  allocatorKeypair
);

console.log(`Allocation executed: ${signature}`);
```

### Example 4: Custom Allocation Engine

```typescript
import { AllocationEngine } from '@motion-companion/keeper';

const allocationConfig = {
  rules: [
    { name: 'Development', percentage: 40, destination: 'dev' },
    { name: 'Marketing', percentage: 30, destination: 'marketing' },
    { name: 'Community', percentage: 20, destination: 'community' },
    { name: 'Reserve', percentage: 10, destination: 'reserve' },
  ],
  checkIntervalMs: 30000,
  minThresholdForAllocation: BigInt(1_000_000), // 0.001 SOL
  dryRun: false,
  postToX: false,
};

const engine = new AllocationEngine(allocationConfig);

// Calculate allocations for 10 SOL available
const availableFunds = BigInt(10_000_000_000);
const allocations = engine.calculateAllocations(availableFunds, availableFunds);

allocations.forEach((alloc) => {
  console.log(`${alloc.rule.name}: ${alloc.amount.toString()} lamports`);
});
```

### Example 5: Run Keeper Bot

```bash
# Configuration in config.json
$ npm run keeper:dev

# Output:
# [2024-02-16T10:30:45.123Z] INFO: Motion Keeper Bot initialized
# [2024-02-16T10:30:45.456Z] INFO: Starting Motion Keeper Bot
# [2024-02-16T10:30:48.789Z] DEBUG: Treasury state
#   totalCollected: 150.750000
#   available: 75.750000
# [2024-02-16T10:30:48.900Z] INFO: Executing allocation
#   type: Development Fund
#   amount: 30.300000
#   destination: dev-multisig
```

## 🔐 Security Considerations

### Smart Contract
- ✅ All instructions require proper authorization
- ✅ Amount validation to prevent edge cases
- ✅ Overflow checks on arithmetic operations
- ✅ Proper account validation and initialization
- ✅ PDA-based account derivation prevents spoofing

### Keeper Bot
- ✅ Keypair management with environment variables
- ✅ Dry-run mode for testing
- ✅ Retry logic with exponential backoff
- ✅ Error logging and status tracking

### Dashboard
- ✅ Read-only data fetching
- ✅ Client-side validation
- ✅ Rate limiting on API calls
- ✅ No sensitive data exposed

## ⚠️ Risk Disclaimers

### Protocol Considerations

This is a **demonstration system** for transparent treasury automation. Production deployment should include:

1. **Governance Review**: All allocation rules must be reviewed and approved
2. **Audit**: Smart contract should be audited by security professionals
3. **Testing**: Extensive testnet deployment before mainnet
4. **Rate Limits**: Implement transaction rate limiting to prevent spam
5. **Multi-sig**: Consider multi-signature approval for treasury updates

### Operational Risks

- **Market Risk**: Allocated funds subject to market volatility
- **Smart Contract Risk**: All operations subject to contract code
- **Keeper Downtime**: Monitor bot uptime and implement fallbacks
- **Social Risk**: X broadcasting could reveal treasury activity timing
- **Custody Risk**: Treasury owner keypair is critical infrastructure

### Mitigation Strategies

```typescript
// 1. Dry-run mode validation
const config = {
  allocation: {
    dryRun: true, // Enable testing without transactions
  },
};

// 2. Threshold configuration
const keeperConfig = {
  allocation: {
    minThresholdForAllocation: BigInt(1_000_000_000), // Minimum 1 SOL
    checkIntervalMs: 60000, // Slower polling
  },
};

// 3. Cooldown period
const ALLOCATION_WAIT_TIME = 3600; // 1 hour between allocations

// 4. Rules validation
const validation = engine.validateRules(rules);
if (!validation.valid) {
  console.error('Invalid rules:', validation.errors);
  process.exit(1);
}
```

## 📊 Metrics & Monitoring

The system tracks comprehensive metrics:

```typescript
interface MetricsSnapshot {
  timestamp: number;              // Snapshot time
  totalFeesCollected: bigint;     // Total collected
  totalAllocated: bigint;         // Total allocated
  allocationCount: number;        // Number of allocations
  availableFunds: bigint;         // Available funds
  lastAllocationAt: number;       // Last allocation time
  treasury: string;               // Treasury pubkey
}
```

### Key Performance Indicators

- **Allocation Frequency**: Allocations per hour
- **Average Allocation Size**: Mean allocation amount
- **Rule Utilization**: Which allocation rules are most active
- **Keeper Uptime**: Percentage of time bot is running
- **Fee Collection Rate**: Fees collected per day
- **Latency**: Time between threshold trigger and execution

## 🧪 Testing

Run the test suite:

```bash
# All tests
npm run test

# Contract tests
cd packages/contract && npm run test

# Integration tests
npm run test:integration
```

Example test:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MotionCompanion } from "../target/types/motion_companion";

describe("motion-companion", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.MotionCompanion as Program<MotionCompanion>;

  it("records fee correctly", async () => {
    // Record 10 tokens
    const tx = await program.methods
      .recordFee(new anchor.BN(10_000_000), "test-source")
      .accounts({
        // Account setup
      })
      .rpc();

    // Verify transaction
    const confirmation = await program.provider.connection.confirmTransaction(tx);
    expect(confirmation.value.err).to.be.null;
  });
});
```

## 📖 Documentation Structure

```
docs/
├── README.md                 # This file
├── ARCHITECTURE.md          # System design details
├── CONTRACT.md              # Smart contract documentation
├── KEEPER.md                # Keeper bot guide
├── DASHBOARD.md             # Dashboard documentation
├── API.md                   # API reference
├── DEPLOYMENT.md            # Mainnet deployment guide
└── SECURITY.md              # Security considerations
```

## 🚢 Deployment Guide

### Localnet Deployment

```bash
# Start Solana localnet
solana-test-validator

# Deploy contract
cd packages/contract
anchor deploy

# Get program ID and update config.json
# Then start keeper
npm run keeper:dev

# In another terminal, start dashboard
npm run dashboard:dev
```

### Devnet Deployment

```bash
# Configure Solana CLI
solana config set --url https://api.devnet.solana.com

# Fund account
solana airdrop 2

# Deploy contract
cd packages/contract
anchor deploy

# Update environment variables
export NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com

# Start services
npm run keeper:dev
npm run dashboard:dev
```

### Mainnet Deployment

⚠️ **Read SECURITY.md before mainnet deployment**

```bash
# 1. Audit smart contract
# 2. Test extensively on devnet
# 3. Create multi-sig treasury account
# 4. Configure production keeper with rate limiting
# 5. Deploy contract with verified settings
# 6. Enable X broadcasting with caution
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Solana Documentation](https://docs.solana.com)
- [Anchor Framework](https://www.anchor-lang.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [SPL Token Program](https://spl.solana.com/token)

## 📞 Support

For issues and questions:

- **GitHub Issues**: [Report bugs](https://github.com/softwaredevelopoor/Motion-Companion/issues)
- **Documentation**: Check `docs/` folder
- **Discord**: [Join community](https://discord.gg/solana)

## 🎯 Roadmap

- [ ] Multi-sig governance support
- [ ] Advanced allocation strategies
- [ ] Analytics dashboard
- [ ] Webhook notifications
- [ ] Mainnet deployment
- [ ] Community DAO integration
- [ ] Risk management features
- [ ] Performance optimization

---

**Motion Companion** - Transparent Treasury Automation on Solana

Built with ❤️ for the Solana ecosystem
