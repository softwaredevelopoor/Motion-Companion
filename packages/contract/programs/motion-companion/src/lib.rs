use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, Transfer, transfer};

declare_id!("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFU");

pub fn get_treasury_pda(bump: &mut u8) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"treasury"], &id())
}

pub fn get_allocation_pda(allocation_id: u64, bump: &mut u8) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"allocation", &allocation_id.to_le_bytes()], &id())
}

#[program]
pub mod motion_companion {
    use super::*;

    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        allocation_rules: Vec<AllocationRule>,
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.bump = ctx.bumps.treasury;
        treasury.fee_token = ctx.accounts.fee_token.key();
        treasury.owner = ctx.accounts.owner.key();
        treasury.total_fees_collected = 0;
        treasury.total_allocated = 0;
        treasury.allocation_count = 0;
        treasury.rules_hash = compute_rules_hash(&allocation_rules)?;
        treasury.created_at = Clock::get()?.unix_timestamp;
        treasury.last_allocation_at = 0;

        emit!(TreasuryInitialized {
            treasury: treasury.key(),
            owner: ctx.accounts.owner.key(),
            fee_token: ctx.accounts.fee_token.key(),
            created_at: treasury.created_at,
            rules_hash: treasury.rules_hash,
        });

        Ok(())
    }

    pub fn record_fee(
        ctx: Context<RecordFee>,
        amount: u64,
        source: String,
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        
        require!(amount > 0, MotionCompanionError::InvalidAmount);
        require_signer!(ctx.accounts.fee_collector);

        // Transfer fee to treasury vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.fee_source.to_account_info(),
            to: ctx.accounts.treasury_vault.to_account_info(),
            authority: ctx.accounts.fee_collector.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, amount)?;

        treasury.total_fees_collected = treasury.total_fees_collected.checked_add(amount)
            .ok_or(MotionCompanionError::Overflow)?;

        emit!(FeeRecorded {
            treasury: treasury.key(),
            amount,
            source,
            total_collected: treasury.total_fees_collected,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn execute_allocation(
        ctx: Context<ExecuteAllocation>,
        allocation_id: u64,
        allocation_data: AllocationData,
        amount: u64,
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        
        require!(amount > 0, MotionCompanionError::InvalidAmount);
        require!(amount <= treasury.total_fees_collected, MotionCompanionError::InsufficientFunds);
        require_signer!(ctx.accounts.allocator);

        let allocation = &mut ctx.accounts.allocation;
        allocation.id = allocation_id;
        allocation.treasury = treasury.key();
        allocation.allocation_type = allocation_data.allocation_type.clone();
        allocation.amount = amount;
        allocation.destination = allocation_data.destination;
        allocation.status = AllocationStatus::Completed;
        allocation.executed_at = Clock::get()?.unix_timestamp;
        allocation.bump = ctx.bumps.allocation;

        treasury.total_allocated = treasury.total_allocated.checked_add(amount)
            .ok_or(MotionCompanionError::Overflow)?;
        treasury.allocation_count = treasury.allocation_count.checked_add(1)
            .ok_or(MotionCompanionError::Overflow)?;
        treasury.last_allocation_at = Clock::get()?.unix_timestamp;

        // Transfer allocation amount from treasury vault to destination
        let treasury_bump = treasury.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[b"treasury", &[treasury_bump]]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.treasury_vault.to_account_info(),
            to: allocation_data.destination_account.to_account_info(),
            authority: ctx.accounts.treasury.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(cpi_ctx, amount)?;

        emit!(AllocationExecuted {
            allocation_id,
            treasury: treasury.key(),
            allocation_type: allocation_data.allocation_type,
            amount,
            destination: allocation_data.destination,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_rules(
        ctx: Context<UpdateRules>,
        new_rules: Vec<AllocationRule>,
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        require_signer!(ctx.accounts.owner);

        let new_rules_hash = compute_rules_hash(&new_rules)?;
        treasury.rules_hash = new_rules_hash;

        emit!(RulesUpdated {
            treasury: treasury.key(),
            new_rules_hash,
            updated_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

fn compute_rules_hash(rules: &[AllocationRule]) -> Result<[u8; 32]> {
    // Simplified hash - in production use proper cryptographic hashing
    let mut hash = [0u8; 32];
    let rules_bytes = format!("{:?}", rules).as_bytes();
    let len = std::cmp::min(32, rules_bytes.len());
    hash[..len].copy_from_slice(&rules_bytes[..len]);
    Ok(hash)
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 32 + 8 + 8 + 1,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    pub fee_token: Account<'info, Mint>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordFee<'info> {
    #[account(mut)]
    pub treasury: Account<'info, Treasury>,
    #[account(mut)]
    pub treasury_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub fee_source: Account<'info, TokenAccount>,
    pub fee_collector: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(allocation_id: u64)]
pub struct ExecuteAllocation<'info> {
    #[account(mut)]
    pub treasury: Account<'info, Treasury>,
    #[account(
        init,
        payer = allocator,
        space = 8 + 32 + 32 + 50 + 8 + 32 + 1 + 8 + 1,
        seeds = [b"allocation", &allocation_id.to_le_bytes()],
        bump
    )]
    pub allocation: Account<'info, Allocation>,
    #[account(mut)]
    pub treasury_vault: Account<'info, TokenAccount>,
    pub allocator: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateRules<'info> {
    #[account(mut)]
    pub treasury: Account<'info, Treasury>,
    pub owner: Signer<'info>,
}

#[account]
pub struct Treasury {
    pub bump: u8,
    pub fee_token: Pubkey,
    pub owner: Pubkey,
    pub total_fees_collected: u64,
    pub total_allocated: u64,
    pub allocation_count: u64,
    pub rules_hash: [u8; 32],
    pub created_at: i64,
    pub last_allocation_at: i64,
}

#[account]
pub struct Allocation {
    pub id: u64,
    pub treasury: Pubkey,
    pub allocation_type: String,
    pub amount: u64,
    pub destination: String,
    pub status: AllocationStatus,
    pub executed_at: i64,
    pub bump: u8,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum AllocationStatus {
    Pending,
    Completed,
    Failed,
}

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct AllocationRule {
    pub name: String,
    pub percentage: u8,
    pub destination: String,
}

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct AllocationData {
    pub allocation_type: String,
    pub destination: String,
    pub destination_account: Pubkey,
}

#[error_code]
pub enum MotionCompanionError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Overflow")]
    Overflow,
    #[msg("Invalid rules")]
    InvalidRules,
    #[msg("Unauthorized")]
    Unauthorized,
}

#[event]
pub struct TreasuryInitialized {
    pub treasury: Pubkey,
    pub owner: Pubkey,
    pub fee_token: Pubkey,
    pub created_at: i64,
    pub rules_hash: [u8; 32],
}

#[event]
pub struct FeeRecorded {
    pub treasury: Pubkey,
    pub amount: u64,
    pub source: String,
    pub total_collected: u64,
    pub timestamp: i64,
}

#[event]
pub struct AllocationExecuted {
    pub allocation_id: u64,
    pub treasury: Pubkey,
    pub allocation_type: String,
    pub amount: u64,
    pub destination: String,
    pub timestamp: i64,
}

#[event]
pub struct RulesUpdated {
    pub treasury: Pubkey,
    pub new_rules_hash: [u8; 32],
    pub updated_at: i64,
}
