# Motion Companion Smart Contract

Anchor-based Solana program for transparent treasury management and capital allocation.

## Program Overview

The Motion Companion smart contract provides:

- **Treasury Management**: Central vault for protocol-generated fees
- **Fee Recording**: Log all incoming protocol fees with source tracking  
- **Allocation Engine**: Execute rule-based capital allocation
- **Event Logging**: All operations emit structured events
- **Rules Management**: Update allocation rules with governance

## Account Structure

### Treasury
- Stores main treasury metadata
- Tracks total fees collected and allocated
- Holds allocation rules hash for verification
- Records creation timestamp and last allocation

### Allocation
- Records each individual capital allocation event
- Stores type, amount, destination, and status
- Indexed by allocation_id for easy lookup
- Includes execution timestamp

## Instructions

### initialize_treasury
Creates and initializes the treasury account.

```
PDA Seeds: ["treasury"]
Payer: Owner
```

### record_fee
Records incoming protocol fees and transfers to treasury vault.

```
Transfers tokens from fee source to treasury vault
Increments total_fees_collected counter
Emits FeeRecorded event
```

### execute_allocation
Executes capital allocation according to rules.

```
Creates Allocation account
Transfers amount from treasury to destination
Updates treasury counters
Emits AllocationExecuted event
PDA Seeds: ["allocation", allocation_id]
```

### update_rules
Updates treasury allocation rules (governance controlled).

```
Owner only
Updates rules_hash
Emits RulesUpdated event
```

## Event Types

All events include timestamp and relevant metadata for audit trail.

## Error Handling

Comprehensive error codes for:
- Invalid amounts
- Insufficient funds
- Arithmetic overflow
- Authorization failures
