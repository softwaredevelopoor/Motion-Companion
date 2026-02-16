**Key features:**

- Treasury account for fund management
- Fee recording with source tracking
- Allocation execution with configurable destinations Types and events
- Rule-based governance
- PDA-based account derivation

**Security Considerations:**

- All instructions require proper authorization
- Amount validation to prevent edge cases
- Overflow checks on arithmetic operations
- Proper account validation and initialization

**Event Tracking:**

All major operations emit events for transparency:
- TreasuryInitialized
- FeeRecorded
- AllocationExecuted
- RulesUpdated
