# Keeper Bot

Autonomous keeper bot that monitors treasury and executes capital allocations.

## Features

- **Treasury Monitoring**: Continuous polling of treasury state
- **Threshold-based Triggers**: Allocations execute when conditions met
- **Rule Engine**: Flexible percentage-based allocation rules
- **Social Broadcasting**: Posts updates to X (Twitter)
- **Dry Run Mode**: Test allocations without executing onchain
- **Graceful Shutdown**: Clean exit with status reports

## Configuration

Edit `config.json` to set:

- **Treasury Rules**: Allocation percentages and destinations
- **Check Interval**: How often to poll treasury (ms)
- **Minimum Threshold**: Minimum fees before allocation triggered
- **Dry Run Mode**: Test without executing
- **X Broadcasting**: Enable/disable social posts

## Running

```bash
npm run dev
```

With custom config:
```bash
KEEPER_CONFIG=/path/to/config.json npm run dev
```

## Allocation Rules

Rules must sum to 100%. Each rule specifies:
- Name: Human-readable rule name
- Percentage: Portion of available funds
- Destination: Target for allocation

Rules are validated before execution.

## State Management

Keeper tracks:
- Total fees processed
- Total allocations executed
- Last processing timestamp
- Current errors
- Uptime

## X Broadcasting

Posts updates for:
- Fee recordings
- Allocation executions
- Rule updates
- Status reports (hourly)

Requires X API credentials in environment.
